const db = require('./db');

// 테이블 생성 함수
function initializeTables() {
  // 추모공간 기본 정보
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
  `, (err) => {
    if (err) console.error('memorial_spaces 테이블 생성 실패:', err);
    else console.log('✅ memorial_spaces 테이블 준비됨');
  });

  // 추모공간 콘텐츠
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
  `, (err) => {
    if (err) console.error('memorial_contents 테이블 생성 실패:', err);
    else console.log('✅ memorial_contents 테이블 준비됨');
  });

  // 방명록
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
  `, (err) => {
    if (err) console.error('guestbook_entries 테이블 생성 실패:', err);
    else console.log('✅ guestbook_entries 테이블 준비됨');
  });

  // 추모공간 콘텐츠 선택
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
  `, (err) => {
    if (err) console.error('memorial_content_settings 테이블 생성 실패:', err);
    else console.log('✅ memorial_content_settings 테이블 준비됨');
  });
}

// 모듈로 export
module.exports = { initializeTables };