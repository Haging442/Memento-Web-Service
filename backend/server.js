// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const chatbotRoutes = require('./chatbot');
const willDocumentsRoutes = require('./routes/willDocuments');
const {sendWillNotification, sendTimeCapsuleNotification} =
    require('./routes/email');
const willExecutionService = require('./services/willExecutionService');

// 1. 먼저 환경변수 로드
dotenv.config();

// 2. Express 앱 생성
const app = express();

// 3. 미들웨어 설정
app.use(cors());
app.use(express.json());

// 4. DB import
const db = require('./db');

// 5. 라우터 import
const users = require('./routes/users');
const assets = require('./routes/assets');
const contacts = require('./routes/contacts');
const admin = require('./routes/admin');
const deathReports = require('./routes/deathreports');
const timeCapsules = require('./routes/timeCapsules');
const dailyQuestions = require('./routes/dailyQuestions');
const geminiRoutes = require('./routes/gemini');
const memorialRoutes = require('./routes/memorial');


// ---------------------------------------------------------------
// ------------------- DB TABLES AUTO CREATE ---------------------
// ---------------------------------------------------------------

db.serialize(() => {
  // USERS (사용자)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'USER',
      death_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);


  // USER MEMORIAL SETTINGS (사용자 추모 공간 설정)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_memorial_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      consent_given INTEGER NOT NULL DEFAULT 0,
      profile_photo_url TEXT,
      selected_content_ids TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // MEMORIAL SPACES (추모공간 기본 정보)
  db.run(`
    CREATE TABLE IF NOT EXISTS memorial_spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      is_enabled INTEGER DEFAULT 0,
      profile_image TEXT,
      display_name TEXT,
      birth_date TEXT,
      death_date TEXT,
      memorial_message TEXT,
      theme_type TEXT DEFAULT 'default',
      custom_theme_prompt TEXT,
      visibility TEXT DEFAULT 'public',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // MEMORIAL CONTENTS (추모공간 콘텐츠)
  db.run(`
    CREATE TABLE IF NOT EXISTS memorial_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memorial_space_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_text TEXT,
      image_url TEXT,
      original_date TEXT,
      keywords TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memorial_space_id) REFERENCES memorial_spaces(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_memorial_date 
    ON memorial_contents(memorial_space_id, original_date)
  `);

  // GUESTBOOK ENTRIES (방명록)
  db.run(`
    CREATE TABLE IF NOT EXISTS guestbook_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memorial_space_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      author_user_id INTEGER,
      message TEXT NOT NULL,
      image_url TEXT,
      visibility TEXT DEFAULT 'public',
      is_deleted INTEGER DEFAULT 0,
      deleted_by INTEGER,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memorial_space_id) REFERENCES memorial_spaces(id) ON DELETE CASCADE,
      FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_memorial_visible 
    ON guestbook_entries(memorial_space_id, is_deleted, visibility)
  `);

  // MEMORIAL CONTENT SETTINGS (추모공간 콘텐츠 선택)
  db.run(`
    CREATE TABLE IF NOT EXISTS memorial_content_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      is_included INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, content_type, content_id)
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

  // DEATH VERIFICATIONS (신뢰 연락처 검증)
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

  // EMAIL LOGS (이메일 발송 기록)
  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_type TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      user_id INTEGER,
      subject TEXT,
      status TEXT DEFAULT 'SUCCESS',
      error_message TEXT,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // TIME CAPSULE RELEASE LOGS (타임캡슐 공개 기록)
  db.run(`
    CREATE TABLE IF NOT EXISTS capsule_release_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      capsule_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      release_type TEXT NOT NULL,
      released_at TEXT DEFAULT CURRENT_TIMESTAMP,
      email_sent INTEGER DEFAULT 0,
      FOREIGN KEY (capsule_id) REFERENCES time_capsules(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // TIME CAPSULES (디지털 타임캡슐)
  db.run(`
    CREATE TABLE IF NOT EXISTS time_capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      message TEXT,
      media_url TEXT,
      content_text TEXT,
      file_url TEXT,
      encrypt_key TEXT,
      file_iv TEXT,
      release_type TEXT NOT NULL,
      release_date TEXT,
      recipient_name TEXT,
      recipient_contact TEXT,
      is_released INTEGER NOT NULL DEFAULT 0,
      beneficiary_email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      released_at TEXT,
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

  // DAILY QUESTIONS (오늘의 질문 풀)
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      category TEXT,
      intent TEXT,
      keywords TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // USER DAILY ANSWERS (사용자 답변)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_daily_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      answered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ai_analysis TEXT,
      entities_extracted TEXT,
      suggestion_shown INTEGER DEFAULT 0,
      suggestion_accepted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES daily_questions(id)
    )
  `);

  // AI SUGGESTIONS (AI 제안)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      answer_id INTEGER NOT NULL,
      suggestion_type TEXT NOT NULL,
      suggestion_text TEXT NOT NULL,
      extracted_data TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (answer_id) REFERENCES user_daily_answers(id) ON DELETE CASCADE
    )
  `);

  // USER QUESTION SCHEDULE (사용자별 질문 스케줄)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_question_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      last_question_date TEXT,
      next_question_id INTEGER,
      questions_answered_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (next_question_id) REFERENCES daily_questions(id)
    )
  `);

  // MEMENTO STORAGE (추가 파일 저장)
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

  // 사망확인서 파일 및 OCR 결과 저장
db.run(`
  CREATE TABLE IF NOT EXISTS death_report_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    death_report_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    ocr_raw TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (death_report_id) REFERENCES death_reports(id) ON DELETE CASCADE
  )
`);

});

// === (옵션) 기존 DB에 updated_at 컬럼이 없을 경우 패치 ===
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
// ---------------------------------------------------------------

const HOUR_MS = 60 * 60 * 1000;
const AUTO_FINALIZE_AFTER_MS = 72 * HOUR_MS;       // 실제 운영값 72시간
const AUTO_FINALIZE_INTERVAL_MS = 10 * 60 * 1000;  // 10분마다 검사

// 수혜자 이메일 조회 헬퍼
function getBeneficiaryEmail(userId) {
  return new Promise((resolve, reject) => {
    db.get(
        `SELECT beneficiary_email 
       FROM asset_instructions 
       WHERE user_id = ? 
       LIMIT 1`,
        [userId], (err, row) => {
          if (err) return reject(err);
          resolve(row?.beneficiary_email);
        });
  });
}

function autoFinalizeDeathReports() {
  const cutoffIso = new Date(Date.now() - AUTO_FINALIZE_AFTER_MS).toISOString();

  db.all(
      `SELECT 
        dr.id, 
        dr.target_user_id, 
        u.name AS deceased_name, 
        wd.storage_location, 
        wd.file_url, 
        u.id AS user_id
     FROM death_reports dr
     JOIN users u ON dr.target_user_id = u.id
     LEFT JOIN will_documents wd ON wd.user_id = u.id
     WHERE dr.status = 'CONFIRMED'
       AND dr.resolved_at IS NOT NULL
       AND dr.resolved_at <= ?`,
      [cutoffIso], (err, rows) => {
        if (err) {
          console.error('[AUTO FINALIZE] query error:', err.message);
          return;
        }
        if (!rows || rows.length === 0) return;

        const stmt = db.prepare(`
        UPDATE death_reports
        SET status = 'FINAL_CONFIRMED',
            admin_note = COALESCE(admin_note, '') || '\n[auto] 72시간 경과로 자동 사망 확정 처리됨.'
        WHERE id = ?
      `);

        rows.forEach((row) => {
          stmt.run(row.id, async (updateErr) => {
            if (updateErr) {
              console.error('[AUTO FINALIZE] update error:', updateErr.message);
              return;
            }

            console.log(`[AUTO FINALIZE] Report ID ${
                row.id} finalized for user ${row.target_user_id}`);

            // 1) 유언장 정보가 있을 때 상속인에게 이메일 발송
            if (row.storage_location && row.file_url) {
              try {
                const beneficiaryEmail = await getBeneficiaryEmail(row.user_id);
                if (beneficiaryEmail) {
                  await sendWillNotification(
                      beneficiaryEmail, row.storage_location, row.file_url,
                      row.deceased_name, row.user_id);
                  console.log(
                      `[EMAIL] Sent will location to ${beneficiaryEmail}`);
                }
              } catch (e) {
                console.error('[EMAIL] Failed to send will notification:', e);
              }
            }

            // 2) 🔹 디지털 자산 유언 집행 안내 메일 발송
            try {
              const execResult = await willExecutionService.runForUser(row.user_id);
              console.log(
                `[WILL EXEC] Finalized user ${row.user_id}: ${execResult.sent} execution guide email(s) sent.`
              );
            } catch (e) {
              console.error(
                '[WILL EXEC] Failed to run execution service for user',
                row.user_id,
                e
              );
            }
          });
        });

        stmt.finalize();
      });
}


setInterval(autoFinalizeDeathReports, AUTO_FINALIZE_INTERVAL_MS);
autoFinalizeDeathReports();  // 서버 시작 시 1회 실행

// ---------------------------------------------------------------
// === FINAL_CONFIRMED 사용자 타임캡슐 자동 공개 (사망 시 ON_DEATH) ===
// ---------------------------------------------------------------

const AUTO_RELEASE_INTERVAL_MS = 10 * 60 * 1000;  // 10분마다

function autoReleaseTimeCapsules() {
  console.log('[AUTO RELEASE] Checking for ON_DEATH capsules to release...');

  db.all(
      `SELECT DISTINCT target_user_id AS user_id 
     FROM death_reports 
     WHERE status = 'FINAL_CONFIRMED'`,
      [], (err, users) => {
        if (err) {
          console.error(
              '[AUTO RELEASE] error finding confirmed users:', err.message);
          return;
        }
        if (!users || users.length === 0) return;

        users.forEach(user => {
          const userId = user.user_id;
          db.all(
              `SELECT id, title, beneficiary_email 
           FROM time_capsules 
           WHERE user_id = ?
             AND release_type = 'ON_DEATH'
             AND (is_released = 0 OR is_released IS NULL)`,
              [userId], (err2, capsules) => {
                if (err2) {
                  console.error(
                      '[AUTO RELEASE] error fetching capsules:', err2.message);
                  return;
                }
                if (!capsules || capsules.length === 0) return;

                const now = new Date().toISOString();

                capsules.forEach(async (capsule) => {
                  db.run(
                      `UPDATE time_capsules 
                 SET is_released = 1, released_at = ? 
                 WHERE id = ?`,
                      [now, capsule.id], async (err3) => {
                        if (err3) {
                          console.error(
                              '[AUTO RELEASE] update error:', err3.message);
                        } else {
                          console.log(`[AUTO RELEASE] Capsule ID ${
                              capsule.id} released for user ${userId}`);

                          // 공개 로그 기록
                          db.run(
                              `INSERT INTO capsule_release_logs (capsule_id, user_id, release_type, email_sent)
                       VALUES (?, ?, 'ON_DEATH', ?)`,
                              [
                                capsule.id, userId,
                                capsule.beneficiary_email ? 1 : 0
                              ],
                              (logErr) => {
                                if (logErr)
                                  console.error(
                                      '[AUTO RELEASE] Failed to log release:',
                                      logErr.message);
                              });

                          // 수혜자 이메일 알림
                          if (capsule.beneficiary_email) {
                            try {
                              await sendTimeCapsuleNotification(
                                  capsule.beneficiary_email, userId,
                                  capsule.title || '제목 없음');
                              console.log(
                                  `[EMAIL] Time capsule notification sent to ${
                                      capsule.beneficiary_email}`);
                            } catch (emailErr) {
                              console.error(
                                  '[EMAIL] Failed to send time capsule notification:',
                                  emailErr);
                            }
                          }
                        }
                      });
                });
              });
        });
      });
}

setInterval(autoReleaseTimeCapsules, AUTO_RELEASE_INTERVAL_MS);
autoReleaseTimeCapsules();  // 서버 시작 시 1회 실행

// ---------------------------------------------------------------
// === ON_DATE 타임캡슐 자동 공개 (날짜 기반) ===
//   - v2에서 추가된 기능을 v1 스타일에 통합
// ---------------------------------------------------------------

const AUTO_RELEASE_ON_DATE_INTERVAL_MS = 10 * 60 * 1000;  // 10분마다

function autoReleaseTimeCapsulesOnDate() {
  console.log('[AUTO RELEASE ON_DATE] Checking scheduled capsules...');

  const nowIso = new Date().toISOString();

  db.all(
      `SELECT id, user_id, title, beneficiary_email
     FROM time_capsules
     WHERE release_type = 'ON_DATE'
       AND release_date IS NOT NULL
       AND release_date <= ?
       AND (is_released = 0 OR is_released IS NULL)`,
      [nowIso], (err, capsules) => {
        if (err) {
          console.error('[AUTO RELEASE ON_DATE] Query error:', err.message);
          return;
        }
        if (!capsules || capsules.length === 0) return;

        const now = new Date().toISOString();

        capsules.forEach((c) => {
          db.run(
              `UPDATE time_capsules
           SET is_released = 1,
               released_at = ?
           WHERE id = ?`,
              [now, c.id], async (err2) => {
                if (err2) {
                  console.error(
                      '[AUTO RELEASE ON_DATE] Update error:', err2.message);
                } else {
                  console.log(`[AUTO RELEASE ON_DATE] Capsule ID ${
                      c.id} released (scheduled).`);

                  // 공개 로그 기록
                  db.run(
                      `INSERT INTO capsule_release_logs (capsule_id, user_id, release_type, email_sent)
                 VALUES (?, ?, 'ON_DATE', ?)`,
                      [c.id, c.user_id, c.beneficiary_email ? 1 : 0],
                      (logErr) => {
                        if (logErr)
                          console.error(
                              '[AUTO RELEASE ON_DATE] Failed to log release:',
                              logErr.message);
                      });

                  // 수혜자 이메일 알림 (원하면 주석 해도 됨)
                  if (c.beneficiary_email) {
                    try {
                      await sendTimeCapsuleNotification(
                          c.beneficiary_email, c.user_id,
                          c.title || '제목 없음');
                      console.log(
                          `[EMAIL] ON_DATE Time capsule notification sent to ${
                              c.beneficiary_email}`);
                    } catch (emailErr) {
                      console.error(
                          '[EMAIL] Failed to send ON_DATE time capsule notification:',
                          emailErr);
                    }
                  }
                }
              });
        });
      });
}

setInterval(autoReleaseTimeCapsulesOnDate, AUTO_RELEASE_ON_DATE_INTERVAL_MS);
autoReleaseTimeCapsulesOnDate();  // 서버 시작 시 1회 실행

// ---------------------------------------------------------------
// === (선택) 이전에 쓰던 컨트롤러 기반 자동 공개를 쓰고 싶다면
//     controllers/timeCapsules.js의 autoRelease를 여기서 다시 연결하면 됨.
// ---------------------------------------------------------------
// try {
//   const { autoRelease } = require('./controllers/timeCapsules.js');
//   if (typeof autoRelease === 'function') {
//     setInterval(autoRelease, 1000 * 60 * 60);
//     console.log('[SCHEDULER] 날짜 기반 타임캡슐 자동 공개(컨트롤러) 활성화');
//   }
// } catch (err) {
//   console.warn('[SCHEDULER] timeCapsules controller autoRelease를 찾을 수
//   없습니다.');
// }

// ---------------------------------------------------------------
// === 정적 파일 제공 (유언장/타임캡슐 파일 등) ===
// ---------------------------------------------------------------

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------
// === 헬스체크 & 루트 정보 ===
// ---------------------------------------------------------------

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Memento API Server is running',
    version: '1.0.0',
    endpoints: {
      users: '/users',
      assets: '/assets',
      contacts: '/contacts',
      admin: '/admin',
      deathReports: '/death-reports',
      dailyQuestion: '/daily-question',
      timecapsules: '/time-capsules',
      memorial: '/api/memorial',
      gemini: '/api/gemini',
      chatbot: '/api/chatbot'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({status: 'healthy', timestamp: new Date().toISOString()});
});

// ---------------------------------------------------------------
// === ROUTES SETUP ===
// ---------------------------------------------------------------

app.use('/users', users);
app.use('/assets', assets);
app.use('/contacts', contacts);
app.use('/admin', admin);
app.use('/death-reports', deathReports);
app.use('/time-capsules', timeCapsules);
// v1 스타일 기본 엔드포인트
app.use('/daily-question', dailyQuestions);
// v2에서 쓰던 복수형 엔드포인트도 같이 지원
app.use('/daily-questions', dailyQuestions);

app.use('/api/memorial', memorialRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/will-documents', willDocumentsRoutes);

// ---------------------------------------------------------------
// === 서버 시작 ===
// ---------------------------------------------------------------

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING: http://localhost:${PORT}`);
  console.log(`📝 Daily Question API: http://localhost:${PORT}/daily-question`);
  console.log(`💎 Gemini API:        http://localhost:${PORT}/api/gemini`);
  console.log(`🕊️  Memorial API:     http://localhost:${PORT}/api/memorial`);
  console.log(`📦 TimeCapsules API:  http://localhost:${PORT}/time-capsules`);
});