const User = require('../models/user');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Kullanıcıyı oluştur
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Email ve şifre kontrolü
  if (!email || !password) {
    return next(new ErrorResponse('Lütfen email ve şifre giriniz', 400));
  }

  // Kullanıcıyı kontrol et
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
  }

  // Şifre kontrolü
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Mevcut kullanıcı bilgilerini getir
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Çıkış yapma - istemci tarafında token'ı temizler
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Token oluşturup response olarak gönder
const sendTokenResponse = (user, statusCode, res) => {
  // Token oluştur
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .json({
      success: true,
      data: {
      token,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
}; 