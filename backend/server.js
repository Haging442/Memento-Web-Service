// server.js
const express = require('express');
const dotenv = require('dotenv');
const db = require('./db');
const users = require('./routes/users');
const assets = require('./routes/assets');
const contacts = require('./routes/contacts');
const admin = require('./routes/admin');
const deathReports = require('./routes/deathreports');


dotenv.config();
const app = express();
app.use(express.json());

const port = process.env.PORT || 4000;

// ------------------- DB TABLES AUTO CREATE --------------------
db.serialize(() => {

  // USERS (사용자)
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


  // TRUSTED CONTACTS (신뢰 연락처)
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

  // DIGITAL ASSETS (디지털 자산)
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

  // DEATH REPORTS (사망 의심 신고)
  db.run(`
    CREATE TABLE IF NOT EXISTS death_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_user_id INTEGER NOT NULL,      -- 사망 의심 대상 사용자
      reporter_name TEXT,                  -- 신고자 이름
      reporter_contact TEXT,               -- 신고자 연락처 (전화/이메일 등)
      relation TEXT,                       -- 대상자와의 관계
      message TEXT,                        -- 신고 내용(상세 사유)
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING / CONFIRMED / REJECTED / CANCELED
      admin_note TEXT,                     -- 관리자가 남기는 메모
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // DEATH VERIFICATIONS (신뢰 연락처 검증)
  db.run(`
    CREATE TABLE IF NOT EXISTS death_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      death_report_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING / CONFIRMED / REJECTED / EXPIRED
      verified_at TEXT,
      FOREIGN KEY (death_report_id) REFERENCES death_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES trusted_contacts(id) ON DELETE CASCADE
    )
  `);

  // ASSET INSTRUCTIONS (디지털 자산 사후 처리 지시서)
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

  // TIME CAPSULES (디지털 타임캡슐)
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

  // WILL DOCUMENTS (자필 유언장 정보)
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

});
// ---------------------------------------------------------------
// === 72시간 이후 자동 사망 확정 처리 설정 ===

// 1시간(ms)
const HOUR_MS = 60 * 60 * 1000;

// 실제 운영값: 72시간
const AUTO_FINALIZE_AFTER_MS = 72 * HOUR_MS;
// const AUTO_FINALIZE_AFTER_MS = 1 * 60 * 1000;  // 1분

// 자동 체크 주기 (얼마마다 검사할지) - 지금은 10분에 한 번
const AUTO_FINALIZE_INTERVAL_MS = 10 * 60 * 1000;
// const AUTO_FINALIZE_INTERVAL_MS = 10 * 1000;  // 10초마다 검사
//  테스트할 때는 10초 같은 걸로 줄여도 됨: const AUTO_FINALIZE_INTERVAL_MS = 10
//  * 1000;

function autoFinalizeDeathReports() {
  const cutoffIso = new Date(Date.now() - AUTO_FINALIZE_AFTER_MS).toISOString();

  // status = 'CONFIRMED' 이고, resolved_at(확인 완료 시간)이 cutoff 이전인
  // 신고들 찾기
  db.all(
      `SELECT id
     FROM death_reports
     WHERE status = 'CONFIRMED'
       AND resolved_at IS NOT NULL
       AND resolved_at <= ?`,
      [cutoffIso], (err, rows) => {
        if (err) {
          console.error('[AUTO FINALIZE] query error:', err.message);
          return;
        }
        if (!rows || rows.length === 0) {
          return;  // 처리할 게 없으면 종료
        }

        const nowNote = new Date().toISOString();
        const ids = rows.map(r => r.id);

        const stmt = db.prepare(`UPDATE death_reports
         SET status = 'FINAL_CONFIRMED',
             admin_note = COALESCE(admin_note, '') || '\n[auto] 72시간 경과로 자동 사망 확정 처리됨.'
         WHERE id = ?`);

        ids.forEach((id) => {
          stmt.run(id);
        });

        stmt.finalize((err2) => {
          if (err2) {
            console.error('[AUTO FINALIZE] update error:', err2.message);
          } else {
            console.log('[AUTO FINALIZE] finalized reports:', ids.join(', '));
          }
        });
      });
}

// 서버가 켜진 후 주기적으로 검사
setInterval(autoFinalizeDeathReports, AUTO_FINALIZE_INTERVAL_MS);
// 서버 시작 시 한 번 실행 (이미 72시간 지난 것들 있을 수 있으니까)
autoFinalizeDeathReports();


// ---------------------- ROUTES SETUP ---------------------------
app.use('/users', require('./routes/users'));
app.use('/assets', require('./routes/assets'));
app.use('/contacts', require('./routes/contacts'));
app.use('/admin', admin);
app.use('/death-reports', deathReports);
// ---------------------------------------------------------------


app.listen(port, () => console.log(`SERVER RUNNING: http://localhost:${port}`));
