// create-test-users.js
// 테스트 계정 생성 스크립트 (Node.js용)

const db = require('./db');
const bcrypt = require('bcrypt');

const testAccounts = [
  { username: 'sumin', password: 'password123', name: '수민', role: 'USER' },
  { username: 'admin', password: 'admin123', name: '관리자', role: 'ADMIN' },
  { username: 'testuser', password: 'test123', name: '테스트유저', role: 'USER' }
];

console.log('🔐 테스트 계정 생성 중...\n');

async function createAccounts() {
  for (const account of testAccounts) {
    try {
      const hash = await bcrypt.hash(account.password, 10);
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)`,
          [account.username, hash, account.name, account.role],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                console.log(`⚠️  ${account.username} - 이미 존재합니다`);
                resolve();
              } else {
                reject(err);
              }
            } else {
              console.log(`✅ ${account.username} 생성 완료 (비밀번호: ${account.password})`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`❌ ${account.username} 생성 실패:`, error.message);
    }
  }

  console.log('\n📋 전체 사용자 목록:');
  db.all('SELECT id, username, name, role FROM users', [], (err, rows) => {
    if (err) {
      console.error('조회 실패:', err.message);
    } else {
      console.table(rows);
    }
    db.close();
    console.log('\n✨ 완료!');
  });
}

createAccounts();