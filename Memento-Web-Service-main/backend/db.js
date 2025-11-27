// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// memento.db 파일 경로 (backend 폴더 기준)
const dbPath = path.join(__dirname, 'memento.db');

// DB 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ DB 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite DB (memento.db) connected.');
  }
});

module.exports = db;