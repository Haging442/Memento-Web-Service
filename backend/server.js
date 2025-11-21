// server.js
const express = require('express');
const dotenv = require('dotenv');
const db = require('./db');
const users = require('./src/routes/users');
const assets = require('./src/routes/assets');
const contacts = require('./src/routes/contacts');
const admin = require('./src/routes/admin');
const deathReports = require('./src/routes/deathreports');
const timeCapsules = require('./src/routes/timeCapsules');


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

  // ASSET INSTRUCTIONS (디지털 자산 사후 지시)
  db.run(`
    CREATE TABLE IF NOT EXISTS asset_instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL UNIQUE,
      action TEXT NOT NULL,                 -- DELETE / TRANSFER / KEEP / MEMORIALIZE / OTHER
      beneficiary_name TEXT,                -- 인계 대상자 이름
      beneficiary_contact TEXT,             -- 인계 대상자 연락처
      note TEXT,                            -- 추가 메모
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (asset_id) REFERENCES digital_assets(id) ON DELETE CASCADE
    )
  `);

  // TIME CAPSULES (사후 메시지 / 타임캡슐)
  db.run(`
    CREATE TABLE IF NOT EXISTS time_capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,              -- 작성자(소유자)
      title TEXT NOT NULL,                   -- 타임캡슐 제목
      message TEXT,                          -- 내용(텍스트 유언/편지)
      media_url TEXT,                        -- (선택) 미디어 경로/URL (파일업로드는 나중에)
      release_type TEXT NOT NULL,            -- ON_DEATH / ON_DATE / IMMEDIATE
      release_date TEXT,                     -- 특정 날짜 공개용 (ISO 문자열)
      recipient_name TEXT,                   -- 받을 사람 이름
      recipient_contact TEXT,                -- 받을 사람 연락처 (이메일/전화)
      is_released INTEGER NOT NULL DEFAULT 0,-- 0=아직 비공개, 1=공개 완료
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      released_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});
// === time_capsules.updated_at 컬럼 자동 추가 (이미 있으면 무시) ===
db.all('PRAGMA table_info(time_capsules)', (err, columns) => {
  if (err) {
    console.error('[DB CHECK ERROR]', err.message);
    return;
  }

  const hasUpdatedAt = columns.some(col => col.name === 'updated_at');

  if (!hasUpdatedAt) {
    console.log('[DB PATCH] Adding updated_at column to time_capsules...');

    db.run('ALTER TABLE time_capsules ADD COLUMN updated_at TEXT', (err2) => {
      if (err2) {
        console.error('[DB PATCH ERROR]', err2.message);
      } else {
        console.log('[DB PATCH] updated_at column added!');
      }
    });
  }
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
//   테스트할 때는 10초 같은 걸로 줄여도 됨: const AUTO_FINALIZE_INTERVAL_MS =
//   10
//   * 1000;

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

// ---------------------------------------------------------------
// === FINAL_CONFIRMED 사용자 타임캡슐 자동 공개 ===

// 10분마다 확인 (원하면 테스트 시 5초로 줄여도 됨)
const AUTO_RELEASE_INTERVAL_MS = 10 * 60 * 1000;
// const AUTO_RELEASE_INTERVAL_MS = 5000;  // <-- 테스트용 5초

function autoReleaseTimeCapsules() {
  console.log('[AUTO RELEASE] Checking for capsules to release...');

  // 1) FINAL_CONFIRMED 된 사용자 ID 가져오기
  db.all(
      `
    SELECT DISTINCT target_user_id AS user_id
    FROM death_reports
    WHERE status = 'FINAL_CONFIRMED'
    `,
      [], (err, users) => {
        if (err) {
          console.error(
              '[AUTO RELEASE] error finding confirmed users:', err.message);
          return;
        }
        if (!users || users.length === 0) return;

        // 각 사용자에 대해 타임캡슐 공개
        users.forEach(user => {
          const userId = user.user_id;

          // 2) release_type = ON_DEATH AND is_released = 0 인 캡슐들 조회
          db.all(
              `
          SELECT id
          FROM time_capsules
          WHERE user_id = ?
            AND release_type = 'ON_DEATH'
            AND is_released = 0
          `,
              [userId], (err2, capsules) => {
                if (err2) {
                  console.error(
                      '[AUTO RELEASE] error fetching capsules:', err2.message);
                  return;
                }
                if (!capsules || capsules.length === 0) return;

                const now = new Date().toISOString();

                capsules.forEach(capsule => {
                  db.run(
                      `
                UPDATE time_capsules
                SET is_released = 1,
                    released_at = ?
                WHERE id = ?
                `,
                      [now, capsule.id], err3 => {
                        if (err3) {
                          console.error(
                              '[AUTO RELEASE] update error:', err3.message);
                        } else {
                          console.log(`[AUTO RELEASE] Capsule ID ${
                              capsule.id} released for user ${userId}`);
                        }
                      });
                });
              });
        });
      });
}

// ---------------------------------------------------------------
// === ON_DATE 타임캡슐 자동 공개 ===

// 10분마다 확인 (테스트용으로 5초 가능)
const AUTO_RELEASE_ON_DATE_INTERVAL_MS = 10 * 60 * 1000;
// const AUTO_RELEASE_ON_DATE_INTERVAL_MS = 5000; // 테스트용

function autoReleaseTimeCapsulesOnDate() {
  console.log('[AUTO RELEASE ON_DATE] Checking scheduled capsules...');

  const nowIso = new Date().toISOString();

  db.all(
      `
    SELECT id
    FROM time_capsules
    WHERE release_type = 'ON_DATE'
      AND release_date IS NOT NULL
      AND release_date <= ?
      AND is_released = 0
    `,
      [nowIso], (err, capsules) => {
        if (err) {
          console.error('[AUTO RELEASE ON_DATE] Query error:', err.message);
          return;
        }
        if (!capsules || capsules.length === 0) return;

        const now = new Date().toISOString();

        capsules.forEach(c => {
          db.run(
              `
          UPDATE time_capsules
          SET is_released = 1,
              released_at = ?
          WHERE id = ?
          `,
              [now, c.id], err2 => {
                if (err2) {
                  console.error(
                      '[AUTO RELEASE ON_DATE] Update error:', err2.message);
                } else {
                  console.log(`[AUTO RELEASE ON_DATE] Capsule ID ${
                      c.id} released (scheduled).`);
                }
              });
        });
      });
}

// 주기 실행
setInterval(autoReleaseTimeCapsulesOnDate, AUTO_RELEASE_ON_DATE_INTERVAL_MS);
// 서버 켜질 때 한 번 검사
autoReleaseTimeCapsulesOnDate();

// 주기 실행
setInterval(autoReleaseTimeCapsules, AUTO_RELEASE_INTERVAL_MS);
// 서버 켜질 때 1회 실행
autoReleaseTimeCapsules();


// ---------------------- ROUTES SETUP ---------------------------
app.use('/users', require('./src/routes/users'));
app.use('/assets', require('./src/routes/assets'));
app.use('/contacts', require('./src/routes/contacts'));
app.use('/admin', admin);
app.use('/death-reports', deathReports);
app.use('/time-capsules', timeCapsules);
// ---------------------------------------------------------------


app.listen(port, () => console.log(`SERVER RUNNING: http://localhost:${port}`));
