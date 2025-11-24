// server.js
const express = require('express');
const dotenv = require('dotenv');
const db = require('./db');
const users = require('./routes/users');
const assets = require('./routes/assets');
const contacts = require('./routes/contacts');
const admin = require('./routes/admin');
const deathReports = require('./routes/deathreports');
const memento = require('./routes/memento');
const sendWillNotification = require('./routes/email');
const timeCapsules =require("./routes/timeCapsules");

dotenv.config();
const app = express();
app.use(express.json());

const port = process.env.PORT || 4000;

// ------------------- DB TABLES AUTO CREATE --------------------
db.serialize(() => {

  // USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // TRUSTED CONTACTS
  db.run(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      relation TEXT,
      email TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // DIGITAL ASSETS
  db.run(`
    CREATE TABLE IF NOT EXISTS digital_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_name TEXT NOT NULL,
      category TEXT,
      login_id TEXT,
      memo TEXT,
      monthly_fee INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // DEATH REPORTS
  db.run(`
    CREATE TABLE IF NOT EXISTS death_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_user_id INTEGER NOT NULL,
      reporter_name TEXT,
      reporter_contact TEXT,
      relation TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      admin_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // DEATH VERIFICATIONS
  db.run(`
    CREATE TABLE IF NOT EXISTS death_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      death_report_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      verified_at TEXT,
      FOREIGN KEY (death_report_id) REFERENCES death_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES trusted_contacts(id) ON DELETE CASCADE
    )
  `);

  // ASSET INSTRUCTIONS
  db.run(`
    CREATE TABLE IF NOT EXISTS asset_instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      beneficiary_name TEXT,
      beneficiary_email TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES digital_assets(id) ON DELETE CASCADE
    )
  `);

  // TIME CAPSULES
  db.run(`
    CREATE TABLE IF NOT EXISTS time_capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      content_text TEXT,
      file_url TEXT,
      encrypt_key TEXT,
      release_type TEXT,
      release_date TEXT,
      beneficiary_email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // WILL DOCUMENTS
  db.run(`
    CREATE TABLE IF NOT EXISTS will_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      file_url TEXT,
      storage_location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // MEMENTO STORAGE
  db.run(`
    CREATE TABLE IF NOT EXISTS memento_storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      encrypted_location TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});
// ---------------------------------------------------------------

// === 72시간 이후 자동 사망 확정 처리 설정 ===
const HOUR_MS = 60 * 60 * 1000;
const AUTO_FINALIZE_AFTER_MS = 72 * HOUR_MS;
const AUTO_FINALIZE_INTERVAL_MS = 10 * 60 * 1000; // 10분

function autoFinalizeDeathReports() {
  const cutoffIso = new Date(Date.now() - AUTO_FINALIZE_AFTER_MS).toISOString();

  db.all(
    `SELECT dr.id, dr.target_user_id, u.name AS deceased_name, wd.storage_location, wd.file_url, u.id AS user_id
     FROM death_reports dr
     JOIN users u ON dr.target_user_id = u.id
     LEFT JOIN will_documents wd ON wd.user_id = u.id
     WHERE dr.status = 'CONFIRMED'
       AND dr.resolved_at IS NOT NULL
       AND dr.resolved_at <= ?`,
    [cutoffIso],
    (err, rows) => {
      if (err) {
        console.error('[AUTO FINALIZE] query error:', err.message);
        return;
      }
      if (!rows || rows.length === 0) return;

      const stmt = db.prepare(`UPDATE death_reports
         SET status = 'FINAL_CONFIRMED',
             admin_note = COALESCE(admin_note, '') || '\n[auto] 72시간 경과로 자동 사망 확정 처리됨.'
         WHERE id = ?`);

      rows.forEach(async (row) => {
        stmt.run(row.id, async (updateErr) => {
          if (updateErr) {
            console.error('[AUTO FINALIZE] update error:', updateErr.message);
            return;
          }

          // Send will email if storage location exists
          if (row.storage_location && row.file_url) {
            try {
              const beneficiaryEmail = await getBeneficiaryEmail(row.user_id);
              if (beneficiaryEmail) {
                await sendWillNotification(
                  beneficiaryEmail,
                  row.storage_location,
                  row.file_url,
                  row.deceased_name
                );
                console.log(`[EMAIL] Sent will location to ${beneficiaryEmail}`);
              }
            } catch (e) {
              console.error("[EMAIL] Failed to send will notification:", e);
            }
          }
        });
      });

      stmt.finalize();
    }
  );
}

// Helper to get beneficiary email
function getBeneficiaryEmail(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT beneficiary_email FROM asset_instructions WHERE user_id = ? LIMIT 1`,
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row?.beneficiary_email);
      }
    );
  });
}

// ------------------- Start auto finalize ----------------------
setInterval(autoFinalizeDeathReports, AUTO_FINALIZE_INTERVAL_MS);
autoFinalizeDeathReports();

// ---------------------- ROUTES SETUP ---------------------------
app.use('/users', users);
app.use('/assets', assets);
app.use('/contacts', contacts);
app.use('/admin', admin);
app.use('/death-reports', deathReports);
app.use('/memento', memento);
// ---------------------------------------------------------------

app.listen(port, () => console.log(`SERVER RUNNING: http://localhost:${port}`));
