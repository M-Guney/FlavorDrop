const User = require('../models/user');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendorProfile');
const Order = require('../models/order');

// @desc    Kullanıcı kaydı
// @route   POST /api/users/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Kullanıcı oluştur
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'

    
  });
  console.log(user)

  // Token oluştur
  sendTokenResponse(user, 201, res);
});

// @desc    Kullanıcı girişi
// @route   POST /api/users/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
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

  // Şifre doğrulama
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
  }

  // Token oluştur
  sendTokenResponse(user, 200, res);
});

// @desc    Kullanıcı profil bilgilerini getir
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Kullanıcı profil bilgilerini güncelle
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone, address } = req.body;
  
  // E-posta değişimi durumunda e-postanın benzersiz olup olmadığını kontrol et
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existingUser) {
      return next(new ErrorResponse('Bu e-posta adresi zaten kullanılıyor', 400));
    }
  }
  
  // Güncellenecek alanları belirle
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  
  // Kullanıcıyı güncelle
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!user) {
    return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Kullanıcı şifresini değiştir
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Mevcut şifre ve yeni şifre gereklidir', 400));
  }
  
  // Şifre minimum uzunluk kontrolü
  if (newPassword.length < 6) {
    return next(new ErrorResponse('Şifre en az 6 karakter uzunluğunda olmalıdır', 400));
  }
  
  // Kullanıcıyı şifresiyle birlikte getir
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
  }
  
  // Mevcut şifreyi kontrol et
  const isMatch = await user.matchPassword(currentPassword);
  
  if (!isMatch) {
    return next(new ErrorResponse('Mevcut şifre yanlış', 401));
  }
  
  // Şifreyi güncelle
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Şifre başarıyla güncellendi'
  });
});

// Token oluşturma yardımcı fonksiyonu
const sendTokenResponse = (user, statusCode, res) => {
  // Token oluştur
  const token = user.getSignedJwtToken();

  // Cookie seçenekleri
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  // User bilgilerinden şifreyi çıkar
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userData
    });
};

// @desc    Admin yetkisini kontrol et
// @route   GET /api/users/check-admin
// @access  Private
exports.checkAdminAuth = asyncHandler(async (req, res, next) => {
  // req.user middleware'den gelir ve halihazırda doğrulanmış kullanıcıyı içerir
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
  }
  
  // Kullanıcı admin mi kontrol et
  const isAdmin = user.role === 'admin';
  
  res.status(200).json({
    success: true,
    isAdmin
  });
});

// @desc    Admin dashboard istatistiklerini getir
// @route   GET /api/users/admin/stats
// @access  Private/Admin
exports.getAdminStats = asyncHandler(async (req, res, next) => {
  try {
    // Toplam kullanıcı sayısı
    const userCount = await User.countDocuments();
    
    // Toplam restoran sayısı
    const vendorCount = await Vendor.countDocuments();
    
    // Toplam sipariş sayısı
    const orderCount = await Order.countDocuments();
    
    // Bekleyen sipariş sayısı
    const pendingOrderCount = await Order.countDocuments({ 
      status: { $in: ['pending', 'accepted', 'preparing'] } 
    });

    // İstatistikleri döndür
    res.status(200).json({
      success: true,
      data: {
        userCount,
        vendorCount,
        orderCount,
        pendingOrderCount,
        systemStatus: 'active',
        lastCheck: new Date()
      }
    });
  } catch (error) {
    return next(new ErrorResponse('İstatistikler alınırken bir hata oluştu', 500));
  }
});

// @desc    Admin için kullanıcı istatistiklerini getir
// @route   GET /api/users/admin/user-statistics
// @access  Private/Admin
exports.getUserStatistics = asyncHandler(async (req, res, next) => {
  try {
    // Toplam kullanıcı sayısı
    const totalUsers = await User.countDocuments();
    
    // Aktif kullanıcı sayısı
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // İnaktif kullanıcı sayısı
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Admin sayısı
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // Satıcı sayısı
    const vendorUsers = await User.countDocuments({ role: 'vendor' });
    
    // Normal kullanıcı sayısı
    const normalUsers = await User.countDocuments({ role: 'user' });
    
    res.status(200).json({
      success: true,
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      vendorUsers,
      normalUsers
    });
  } catch (error) {
    console.error('Kullanıcı istatistikleri alınamadı:', error);
    return next(new ErrorResponse('Kullanıcı istatistikleri alınırken bir hata oluştu', 500));
  }
});

// @desc    Admin için tüm kullanıcıları getir
// @route   GET /api/users/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    
    // Filtreleme için sorgu oluştur
    const query = {};
    
    // Arama filtresi
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Rol filtresi
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Toplam kullanıcı sayısını al
    const total = await User.countDocuments(query);
    
    // Kullanıcıları getir
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    console.error('Kullanıcılar alınamadı:', error);
    return next(new ErrorResponse('Kullanıcılar alınırken bir hata oluştu', 500));
  }
});

// @desc    Admin için kullanıcı detayını getir
// @route   GET /api/users/admin/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    // Kullanıcıya ait siparişleri al
    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Kullanıcı satıcı ise, satıcı profilini al
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await Vendor.findOne({ user: req.params.id });
    }
    
    res.status(200).json({
      success: true,
      data: {
        user,
        orders,
        vendorProfile
      }
    });
  } catch (error) {
    console.error('Kullanıcı detayı alınamadı:', error);
    return next(new ErrorResponse('Kullanıcı detayı alınırken bir hata oluştu', 500));
  }
});

// @desc    Admin için kullanıcı durumunu değiştir
// @route   PATCH /api/users/admin/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Kullanıcı durumu değiştirilemedi:', error);
    return next(new ErrorResponse('Kullanıcı durumu değiştirilirken bir hata oluştu', 500));
  }
}); 