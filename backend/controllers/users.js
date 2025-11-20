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

// 로그인: 아이디(username) + 비밀번호
exports.login = (req, res) => {
  const {username, password} = req.body;

  if (!username || !password) {
    return res.status(400).json({error: 'USERNAME_AND_PASSWORD_REQUIRED'});
  }

  db.get(
      `SELECT * FROM users WHERE username = ?`, [username],
      async (err, user) => {
        if (err) return res.status(500).json({error: err.message});
        if (!user) return res.status(400).json({error: 'USER_NOT_FOUND'});

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(400).json({error: 'INVALID_PASSWORD'});

        const token = jwt.sign(
            {userId: user.id, role: user.role}, process.env.JWT_SECRET,
            {expiresIn: '1d'});

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          }
        });
      });
};
