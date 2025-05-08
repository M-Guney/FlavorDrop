const Cart = require('../models/cart');
const MenuItem = require('../models/menuItem');
const VendorProfile = require('../models/vendorProfile');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Kullanıcının sepetini getir
// @route   GET /api/cart
// @access  Public/Private - Token varsa kullanıcının sepetini, yoksa boş döner
exports.getCart = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id || req.headers['x-user-id'] || req.query.userId;
  
  // Kullanıcı kimliği yoksa boş sepet döndür
  if (!userId) {
    console.log('Kullanıcı kimliği bulunamadı, boş sepet dönülüyor');
    return res.status(200).json({
      success: true,
      data: { items: [], totalAmount: 0 }
    });
  }
  
  console.log('Sepet getiriliyor, kullanıcı ID:', userId);
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'vendor',
    select: 'businessName phoneNumber address categories'
  });

  if (!cart) {
    console.log('Kullanıcıya ait sepet bulunamadı, boş sepet dönülüyor');
    return res.status(200).json({
      success: true,
      data: { items: [], totalAmount: 0 }
    });
  }

  console.log('Sepet bulundu:', cart._id);
  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Sepete ürün ekle
// @route   POST /api/cart
// @access  Public - Giriş yapmadan kullanılabilir
exports.addToCart = asyncHandler(async (req, res, next) => {
  console.log('addToCart fonksiyonu çağrıldı');
  console.log('İstek gövdesi:', req.body);
  
  // Standart token doğrulama başarısız olduğunda kullanılacak alternatif kullanıcı bilgileri
  const { menuItemId, quantity, notes, sessionId, userId, userEmail } = req.body;
  const customUserId = req.headers['x-user-id'] || userId;
  
  // Kullanıcı bilgilerini kontrol et (standart veya alternatif)
  let user = req.user;
  
  // Eğer req.user yoksa ve başlıklarda veya gövdede kullanıcı kimliği gelmişse
  if (!user && customUserId) {
    console.log(`Token doğrulama başarısız ancak alternatif kimlik bilgileri mevcut. Kullanıcı ID: ${customUserId}`);
    // Burada gerçek bir kullanıcı nesnesi oluşturuyoruz token doğrulama olmasa bile
    user = {
      id: customUserId,
      email: userEmail || 'kullanici@ornek.com'
    };
  }
  
  console.log(user ? `Kullanıcı ID: ${user.id}` : 'Kullanıcı giriş yapmamış');
  
  if (!menuItemId) {
    console.log('Hata: menuItemId belirtilmemiş');
    return next(new ErrorResponse('Menü öğesi ID\'si gereklidir', 400));
  }
  
  // Ürün bilgilerini getir
  console.log('Menü öğesi getiriliyor:', menuItemId);
  const menuItem = await MenuItem.findById(menuItemId);
  
  if (!menuItem) {
    console.log('Hata: Menü öğesi bulunamadı');
    return next(new ErrorResponse('Menü öğesi bulunamadı', 404));
  }
  
  console.log('Menü öğesi bulundu:', menuItem.name);
  
  // Satıcı bilgilerini kontrol et
  const vendor = await VendorProfile.findById(menuItem.vendor);
  console.log('Satıcı bilgisi:', vendor ? vendor.businessName : 'Bulunamadı');
  
  // Kullanıcı bilgisi varsa (standart veya alternatif) onun sepetiyle işlem yap
  if (user) {
    console.log('Kullanıcı bilgileri mevcut, sepet kontrolü yapılıyor');
    
    // Kullanıcının mevcut sepetini kontrol et
    let cart = await Cart.findOne({ user: user.id });
    console.log('Mevcut sepet:', cart ? `Sepet ID: ${cart._id}, Öğe sayısı: ${cart.items.length}` : 'Sepet bulunamadı');
    
    // Eğer sepet varsa ve farklı satıcıya aitse, sepeti temizle
    if (cart && cart.vendor && cart.vendor.toString() !== menuItem.vendor.toString()) {
      console.log('Sepetteki satıcı farklı, mevcut sepet temizleniyor');
      console.log('Sepet satıcı:', cart.vendor.toString());
      console.log('Yeni ürün satıcı:', menuItem.vendor.toString());
      await Cart.findByIdAndDelete(cart._id);
      cart = null;
    }
    
    // Yeni sepet oluştur
    if (!cart) {
      console.log('Yeni sepet oluşturuluyor');
      cart = await Cart.create({
        user: user.id,
        vendor: menuItem.vendor,
        items: [{
          menuItem: menuItem._id,
          quantity: quantity || 1,
          price: menuItem.price,
          name: menuItem.name,
          notes: notes || ''
        }]
      });
      
      console.log('Yeni sepet oluşturuldu:', cart._id);
      
      return res.status(200).json({
        success: true,
        data: cart
      });
    } else {
      // Sepette aynı ürün var mı kontrol et
      const itemIndex = cart.items.findIndex(
        item => item.menuItem.toString() === menuItemId
      );
      
      console.log('Ürün sepette var mı kontrol ediliyor. Index:', itemIndex);
      
      if (itemIndex > -1) {
        // Eğer ürün varsa miktarını güncelle
        console.log('Ürün sepette mevcut, miktar güncelleniyor');
        console.log('Eski miktar:', cart.items[itemIndex].quantity);
        console.log('Eklenecek miktar:', quantity || 1);
        
        cart.items[itemIndex].quantity += parseInt(quantity) || 1;
        cart.items[itemIndex].notes = notes || cart.items[itemIndex].notes;
        
        console.log('Yeni miktar:', cart.items[itemIndex].quantity);
      } else {
        // Eğer ürün yoksa yeni ekle
        console.log('Ürün sepette yok, yeni ekleniyor');
        cart.items.push({
          menuItem: menuItem._id,
          quantity: quantity || 1,
          price: menuItem.price,
          name: menuItem.name,
          notes: notes || ''
        });
      }
      
      console.log('Sepet kaydediliyor...');
      await cart.save();
      console.log('Sepet kaydedildi');
    
      // Güncellenmiş sepeti döndür
    return res.status(200).json({
      success: true,
      data: cart
    });
  }
  }
  
  console.log('Kullanıcı giriş yapmamış, geçici sepet bilgileri dönülüyor');
  
  // Eğer kullanıcı giriş yapmamışsa, geçici sepet bilgilerini dön
  return res.status(200).json({
    success: true,
    data: {
      item: {
        menuItem: menuItem._id,
        quantity: quantity || 1,
        price: menuItem.price,
        name: menuItem.name,
        notes: notes || ''
      },
      message: 'Ürün geçici sepete eklendi. Sipariş tamamlamak için giriş yapmalısınız.',
      requiresLogin: true
    }
  });
});

// @desc    Sepetteki ürün miktarını güncelle
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity, notes } = req.body;
  const { itemId } = req.params;
  
  // Kullanıcının sepetini getir
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Sepet bulunamadı', 404));
  }
  
  // Sepette ürünü bul
  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === itemId
  );
  
  if (itemIndex === -1) {
    return next(new ErrorResponse('Sepette böyle bir ürün bulunamadı', 404));
  }
  
  // Ürün miktarını güncelle
  if (quantity === 0) {
    // Eğer miktar 0 ise ürünü sepetten kaldır
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
    
    // Eğer notlar geldiyse güncelle
    if (notes !== undefined) {
      cart.items[itemIndex].notes = notes;
    }
  }
  
  // Eğer sepette hiç ürün kalmadıysa sepeti sil
  if (cart.items.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return res.status(200).json({
      success: true,
      data: { items: [], totalAmount: 0 }
    });
  }
  
  await cart.save();
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Sepetten ürün çıkar
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  
  // Kullanıcının sepetini getir
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Sepet bulunamadı', 404));
  }
  
  // Sepette ürünü bul
  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === itemId
  );
  
  if (itemIndex === -1) {
    return next(new ErrorResponse('Sepette böyle bir ürün bulunamadı', 404));
  }
  
  // Ürünü sepetten çıkar
  cart.items.splice(itemIndex, 1);
  
  // Eğer sepette hiç ürün kalmadıysa sepeti sil
  if (cart.items.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return res.status(200).json({
      success: true,
      data: { items: [], totalAmount: 0 }
    });
  }
  
  await cart.save();
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Sepeti temizle
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  // Kullanıcının sepetini sil
  await Cart.findOneAndDelete({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    data: { items: [], totalAmount: 0 }
  });
}); 