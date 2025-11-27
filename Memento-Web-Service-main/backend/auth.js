// auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 토큰 존재 여부 확인
  if (!authHeader) {
    return res.status(401).json({ error: 'NO TOKEN' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // decoded 안에 { userId, role } 들어있음
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID TOKEN' });
  }
};
