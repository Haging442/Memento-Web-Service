// controllers/users.js
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ------------------------------------------------------
// 1. 회원가입: 아이디(username) + 비밀번호 + 이름 + (선택) 관리자 여부
//    - isAdmin은 디버그/개발용 플래그 (실서비스에서는 막는 게 안전)
// ------------------------------------------------------
exports.register = (req, res) => {
  const { username, password, name, isAdmin } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'USERNAME_AND_PASSWORD_REQUIRED' });
  }

  // role 결정 (관리자 / 사용자)
  const role = isAdmin ? 'ADMIN' : 'USER';

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      `INSERT INTO users (username, password_hash, name, role)
       VALUES (?, ?, ?, ?)`,
      [username, hash, name || null, role],
      function (insertErr) {
        if (insertErr) {
          if (
            insertErr.message.includes(
              'UNIQUE constraint failed: users.username'
            )
          ) {
            return res
              .status(400)
              .json({ error: 'USERNAME_ALREADY_EXISTS' });
          }
          return res.status(400).json({ error: insertErr.message });
        }
        res.json({
          message: 'REGISTERED',
          userId: this.lastID,
          role,
        });
      }
    );
  });
};

// ------------------------------------------------------
// 2. 로그인: 아이디(username) + 비밀번호 (디버그 로그 포함)
// ------------------------------------------------------
exports.login = (req, res) => {
  const { username, password } = req.body || {};

  console.log('🔐 [LOGIN] 로그인 시도:', {
    username,
    passwordLength: password?.length,
    timestamp: new Date().toISOString(),
  });

  if (!username || !password) {
    console.log('❌ [LOGIN] 필수 필드 누락');
    return res
      .status(400)
      .json({ error: 'USERNAME_AND_PASSWORD_REQUIRED' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (err) {
        console.error('❌ [LOGIN] DB 조회 오류:', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        console.log('❌ [LOGIN] 사용자 없음:', username);
        return res.status(400).json({ error: 'USER_NOT_FOUND' });
      }

      console.log('👤 [LOGIN] 사용자 찾음:', {
        userId: user.id,
        username: user.username,
        role: user.role,
        hasHash: !!user.password_hash,
        hashPrefix: user.password_hash?.substring(0, 10),
      });

      try {
        console.log('🔑 [LOGIN] 비밀번호 비교 중...');
        const ok = await bcrypt.compare(password, user.password_hash);

        console.log('🔑 [LOGIN] 비밀번호 비교 결과:', ok ? '✅ 일치' : '❌ 불일치');

        if (!ok) {
          return res.status(400).json({ error: 'INVALID_PASSWORD' });
        }

        console.log('🎫 [LOGIN] JWT 토큰 생성 중...');
        const token = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        console.log('✅ [LOGIN] 로그인 성공:', {
          userId: user.id,
          username: user.username,
          role: user.role,
        });

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            death_date: user.death_date || null,
          },
        });

      } catch (compareErr) {
        console.error('❌ [LOGIN] bcrypt 비교 오류:', compareErr);
        return res
          .status(500)
          .json({ error: 'PASSWORD_COMPARE_ERROR' });
      }
    }
  );
};


// ------------------------------------------------------
// 3. 내 프로필 조회 (GET /users/me)
//    - JWT 필요 (auth 미들웨어에서 req.user.userId 세팅)
// ------------------------------------------------------
exports.getMyProfile = (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT id, username, name, role, death_date, created_at
     FROM users
     WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        death_date: user.death_date,
        created_at: user.created_at,
      });
    }
  );
};

// ------------------------------------------------------
// 4. 내 프로필 수정 (이름 변경 정도만, PUT /users/me)
// ------------------------------------------------------
exports.updateMyProfile = (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body || {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'NAME_REQUIRED' });
  }

  db.run(
    `UPDATE users
     SET name = ?
     WHERE id = ?`,
    [name.trim(), userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
      }
      res.json({ message: 'PROFILE_UPDATED', name: name.trim() });
    }
  );
};

// ------------------------------------------------------
// 5. 비밀번호 변경 (PUT /users/change-password)
//    body: { currentPassword, newPassword }
// ------------------------------------------------------
exports.changePassword = (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'CURRENT_AND_NEW_PASSWORD_REQUIRED',
    });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: 'NEW_PASSWORD_TOO_SHORT' });
  }

  // 1) 현재 비밀번호 검증
  db.get(
    `SELECT id, password_hash FROM users WHERE id = ?`,
    [userId],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
      }

      try {
        const ok = await bcrypt.compare(
          currentPassword,
          user.password_hash
        );
        if (!ok) {
          return res
            .status(400)
            .json({ error: 'INVALID_CURRENT_PASSWORD' });
        }

        // 2) 새 비밀번호 해시 후 업데이트
        const newHash = await bcrypt.hash(newPassword, 10);
        db.run(
          `UPDATE users
           SET password_hash = ?
           WHERE id = ?`,
          [newHash, userId],
          function (updateErr) {
            if (updateErr) {
              return res
                .status(500)
                .json({ error: updateErr.message });
            }
            res.json({ message: 'PASSWORD_CHANGED' });
          }
        );
      } catch (e) {
        console.error('❌ [CHANGE_PASSWORD] 오류:', e);
        return res.status(500).json({ error: 'PASSWORD_CHANGE_ERROR' });
      }
    }
  );
};
