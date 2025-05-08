const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/user');

// Kullanıcı giriş yapmış mı kontrolü
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Token'ı header'dan al
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Bearer token'dan sadece token kısmını al
    token = req.headers.authorization.split(' ')[1];
  } 
  // Cookie'den token'ı alma
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Token var mı kontrolü
  if (!token) {
    return next(new ErrorResponse('Bu kaynağa erişim için yetkiniz yok', 401));
  }

  try {
    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token'dan kullanıcı bilgisini al
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('Bu kaynağa erişim için yetkiniz yok', 401));
  }
});

// Belirli rollere sahip kullanıcıları kontrol etme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `${req.user.role} rolü bu işlemi yapmaya yetkili değil`,
          403
        )
      );
    }
    next();
  };
}; 