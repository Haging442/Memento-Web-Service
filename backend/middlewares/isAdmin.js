// middlewares/isAdmin.js
module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({error: 'ADMIN_ONLY'});
  }
  next();
};
// 토큰이 없거나 role이 User인 경우 403 에러를 반환하고, role이 ADMIN인 경우에만
// next() 호출