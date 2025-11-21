// 인증로직
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({error: 'NO TOKEN'});

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded 안에 { userId, role } 들어있음
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({error: 'INVALID TOKEN'});
  }
};
// admin과 user를 구분하기 위해 role도 토큰에 포함