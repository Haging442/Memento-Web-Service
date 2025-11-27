// controllers/users.js (디버그 버전)
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입: 아이디(username) + 비밀번호 + 이름 + (선택)관리자여부
exports.register = (req, res) => {
  const {username, password, name, isAdmin} = req.body;

  if (!username || !password) {
    return res.status(400).json({error: 'USERNAME_AND_PASSWORD_REQUIRED'});
  }

  // role 결정 (관리자 / 사용자)
  const role = isAdmin ? 'ADMIN' : 'USER';

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({error: err.message});

    db.run(
        `INSERT INTO users (username, password_hash, name, role)
       VALUES (?, ?, ?, ?)`,
        [username, hash, name, role], function(err) {
          if (err) {
            if (err.message.includes(
                    'UNIQUE constraint failed: users.username')) {
              return res.status(400).json({error: 'USERNAME_ALREADY_EXISTS'});
            }
            return res.status(400).json({error: err.message});
          }
          res.json({message: 'REGISTERED', userId: this.lastID, role});
        });
  });
};

// 로그인: 아이디(username) + 비밀번호 (디버그 로그 추가)
exports.login = (req, res) => {
  const {username, password} = req.body;

  // 🔍 로그 1: 요청 데이터 확인
  console.log('🔐 [LOGIN] 로그인 시도:', {
    username,
    passwordLength: password?.length,
    timestamp: new Date().toISOString()
  });

  if (!username || !password) {
    console.log('❌ [LOGIN] 필수 필드 누락');
    return res.status(400).json({error: 'USERNAME_AND_PASSWORD_REQUIRED'});
  }

  db.get(
      `SELECT * FROM users WHERE username = ?`, [username],
      async (err, user) => {
        if (err) {
          console.error('❌ [LOGIN] DB 조회 오류:', err.message);
          return res.status(500).json({error: err.message});
        }
        
        if (!user) {
          console.log('❌ [LOGIN] 사용자 없음:', username);
          return res.status(400).json({error: 'USER_NOT_FOUND'});
        }

        // 🔍 로그 2: 사용자 찾음
        console.log('👤 [LOGIN] 사용자 찾음:', {
          userId: user.id,
          username: user.username,
          role: user.role,
          hasHash: !!user.password_hash,
          hashPrefix: user.password_hash?.substring(0, 10)
        });

        try {
          // 🔍 로그 3: 비밀번호 비교 시작
          console.log('🔑 [LOGIN] 비밀번호 비교 중...');
          const ok = await bcrypt.compare(password, user.password_hash);
          
          // 🔍 로그 4: 비교 결과
          console.log('🔑 [LOGIN] 비밀번호 비교 결과:', ok ? '✅ 일치' : '❌ 불일치');
          
          if (!ok) {
            return res.status(400).json({error: 'INVALID_PASSWORD'});
          }

          // 🔍 로그 5: JWT 생성
          console.log('🎫 [LOGIN] JWT 토큰 생성 중...');
          const token = jwt.sign(
              {userId: user.id, role: user.role}, 
              process.env.JWT_SECRET,
              {expiresIn: '1d'}
          );

          // 🔍 로그 6: 로그인 성공
          console.log('✅ [LOGIN] 로그인 성공:', {
            userId: user.id,
            username: user.username,
            role: user.role
          });

          res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role
            }
          });
          
        } catch (compareErr) {
          console.error('❌ [LOGIN] bcrypt 비교 오류:', compareErr);
          return res.status(500).json({error: 'PASSWORD_COMPARE_ERROR'});
        }
      });
};