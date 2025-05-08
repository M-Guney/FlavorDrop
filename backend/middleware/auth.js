const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Korumalı rotalar için token doğrulama middleware'i
exports.protect = async (req, res, next) => {
  try {
    // Token'ı al
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Bu rotaya erişmek için giriş yapmanız gerekiyor' 
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    
    // Kullanıcıyı bul
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Bulunan token ile kullanıcı mevcut değil' 
      });
    }

    // Kullanıcıyı request'e ekle
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth hatası:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Yetkisiz erişim'
    });
  }
};

// Bazı işlemlerde token kontrolü yap, ama hata durumunda devam et
exports.optionalProtect = async (req, res, next) => {
  try {
    // Token'ı al
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('Token bulunamadı, ancak işleme devam edilecek');
      return next();
    }

    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      
      // Kullanıcıyı bul
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        // Kullanıcıyı request'e ekle
        req.user = user;
      }
    } catch (tokenError) {
      console.error('Token doğrulama hatası, ancak işleme devam edilecek:', tokenError);
    }
    
    // Her durumda devam et
    next();
  } catch (error) {
    console.error('Auth hatası:', error);
    // Hata durumunda bile devam et
    next();
  }
};

// Rol bazlı yetkilendirme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} rolü bu kaynağa erişim için yetkili değil`
      });
    }
    next();
  };
}; 