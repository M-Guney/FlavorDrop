const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const VendorProfile = require('../models/vendorProfile');
const Notification = require('../models/notification');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Yeni sipariş oluştur
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  console.log(userId)
  
  // Kullanıcının sepetini bul
  const cart = await Cart.findOne({ user: userId }).populate('items.menuItem');
  console.log(cart);
  
  if (!cart || cart.items.length === 0) {
    return next(new ErrorResponse('Sepetiniz boş, sipariş oluşturulamaz', 400));
    
  }
  console.log(cart.items.length)
  
  // Gerekli teslim bilgilerinin kontrolü
  if (!req.body.deliveryAddress) {
    return next(new ErrorResponse('Teslimat adresi gereklidir', 400));
  }
  
  if (!req.body.contactPhone) {
    return next(new ErrorResponse('İletişim telefonu gereklidir', 400));
  }

  // Kullanıcı bilgilerini al
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
  }

  // Satıcı bilgilerini al
  const vendor = await VendorProfile.findById(cart.vendor);
  if (!vendor) {
    return next(new ErrorResponse('Satıcı bulunamadı', 404));
  }

  // Sepetteki ürünlerden sipariş öğelerini oluştur
  const orderItems = cart.items.map(item => ({
    menuItem: item.menuItem._id,
    name: item.menuItem.name,
    price: item.menuItem.price,
    quantity: item.quantity,
    totalItemPrice: item.menuItem.price * item.quantity
  }));

  // Toplam tutarı hesapla
  const totalAmount = cart.items.reduce(
    (total, item) => total + (item.menuItem.price * item.quantity),
    0
  );

  // Yeni sipariş oluştur
  const order = await Order.create({
    user: userId,
    userName: user.name,
    vendor: cart.vendor,
    vendorName: vendor.businessName,
    items: orderItems,
    totalAmount,
    deliveryAddress: req.body.deliveryAddress,
    contactPhone: req.body.contactPhone,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: 'pending'

  });

  await Cart.findOneAndDelete({ user: userId });

  res.status(201).json({
    success: true,
    data: order
  });
  console.log('Yeni sipariş oluşturuldu:', order)

});

// @desc    Kullanıcının siparişlerini getir
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate('vendor', 'name');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
  console.log(orders)
});

// @desc    Satıcının siparişlerini getir
// @route   GET /api/orders/vendor
// @access  Private/Vendor
exports.getVendorOrders = asyncHandler(async (req, res, next) => {
  // Vendor ID'yi farklı kaynaklardan almaya çalış
  const vendorId = req.user?.id || req.headers['x-user-id'] || req.query.vendorId;
  
  if (!vendorId) {
    return next(new ErrorResponse('Satıcı kimliği bulunamadı', 400));
  }
  
  console.log('Satıcı siparişleri çekilmeye çalışılıyor, vendor ID:', vendorId);
  
  // Vendor kimliğine ait bir VendorProfile var mı kontrol et
  const vendorProfile = await VendorProfile.findOne({ user: vendorId });
  
  if (!vendorProfile) {
    console.log('Vendor profili bulunamadı, user ID:', vendorId);
    return next(new ErrorResponse('Satıcı profili bulunamadı', 404));
  }
  
  console.log('Vendor profili bulundu:', vendorProfile._id);
  
  // Siparişleri çek - satıcının vendor profile ID'si ile
  const orders = await Order.find({ vendor: vendorProfile._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name email');
  
  console.log(`${orders.length} adet sipariş bulundu.`);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Sipariş detayını getir
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderDetails = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('vendor', 'name email phone')
    .populate('user', 'name email');

  if (!order) {
    return next(new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404));
  }

  // Kullanıcı kendi siparişine, satıcı kendi restoranına gelen siparişe veya admin herhangi bir siparişe erişebilir
  if (
    order.user.toString() !== req.user.id && 
    order.vendor.toString() !== req.user.id && 
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Bu kaynağa erişim yetkiniz yok', 403));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Sipariş durumunu güncelle
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor/Admin
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new ErrorResponse('Lütfen sipariş durumunu belirtin', 400));
  }
  
  // Geçerli sipariş durumları - API'nin kabul ettiği durum kodlarını genişletiyoruz
  const validStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Geçersiz sipariş durumu: ${status}`, 400));
  }

  // Siparişi bul
  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404));
  }
  
  // Admin kontrolü
  const isAdmin = req.user.role === 'admin';
  
  // Admin olmayan kullanıcılar için yetki kontrolü
  if (!isAdmin) {
    // Kullanıcı ve satıcı kimliklerini alalım
    const userId = req.user?.id || req.headers['x-user-id'] || req.query.userId;
    
    if (!userId) {
      return next(new ErrorResponse('Kullanıcı kimliği bulunamadı', 400));
    }
    
    // Satıcıya ait vendor profilini bul
    const vendorProfile = await VendorProfile.findOne({ user: userId });
    
    if (!vendorProfile) {
      return next(new ErrorResponse('Satıcı profili bulunamadı', 404));
    }
    
    // Bu sipariş bu satıcıya ait mi kontrol et
    if (order.vendor.toString() !== vendorProfile._id.toString()) {
      console.log('Yetki hatası:', {
        orderId: order._id,
        orderVendor: order.vendor,
        vendorProfileId: vendorProfile._id
      });
      return next(new ErrorResponse('Bu siparişi güncelleme yetkiniz yok', 403));
    }
  }

  // Tamamlanmış veya iptal edilmiş siparişler değiştirilemez
  if (order.status === 'completed' || (order.status === 'cancelled' && status !== 'cancelled')) {
    return next(new ErrorResponse(`${order.status} durumundaki sipariş güncellenemez`, 400));
  }

  // Durumu güncelle
  order = await Order.findByIdAndUpdate(
    req.params.id,
    { 
      status, 
      updatedAt: Date.now(),
      // Özel durumlar için ek alanları güncelle
      ...(status === 'delivered' && { deliveredAt: Date.now() }),
      ...(status === 'completed' && { completedAt: Date.now() }),
      ...(status === 'cancelled' && { 
        cancelledAt: Date.now(),
        cancelReason: req.body.reason || (isAdmin ? 'Admin tarafından iptal edildi' : 'Satıcı tarafından iptal edildi')
      })
    },
    { new: true, runValidators: true }
  );

  console.log(`Sipariş durumu güncellendi: ${req.params.id}, yeni durum: ${status}`);

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Siparişi iptal et
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404));
  }

  // Sadece kullanıcı kendi siparişini iptal edebilir
  if (order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Bu siparişi iptal etme yetkiniz yok', 403));
  }

  // Sadece bekleyen veya hazırlanıyor durumundaki siparişler iptal edilebilir
  if (order.status !== 'pending' && order.status !== 'preparing') {
    return next(new ErrorResponse(`${order.status} durumundaki sipariş iptal edilemez`, 400));
  }

  order = await Order.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'cancelled', 
      cancelReason: req.body.reason || 'Kullanıcı tarafından iptal edildi',
      updatedAt: Date.now() 
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Siparişin teslim edildiğini onayla
// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private
exports.confirmDelivery = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404));
  }

  // Sadece kullanıcı kendi siparişini onaylayabilir
  if (order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Bu siparişi onaylama yetkiniz yok', 403));
  }

  // Sadece "yolda" durumundaki siparişler teslim edildi olarak işaretlenebilir
  if (order.status !== 'ontheway') {
    return next(new ErrorResponse(`${order.status} durumundaki sipariş teslim edildi olarak işaretlenemez`, 400));
  }

  order = await Order.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'delivered',
      isDelivered: true,
      deliveredAt: Date.now(),
      updatedAt: Date.now() 
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: order
  });
});

// Yardımcı fonksiyonlar
const statusTranslations = {
  'pending': 'Beklemede',
  'accepted': 'Kabul Edildi',
  'preparing': 'Hazırlanıyor',
  'out_for_delivery': 'Dağıtımda',
  'delivered': 'Teslim Edildi',
  'completed': 'Tamamlandı',
  'cancelled': 'İptal Edildi'
};

const calculateNextDeliveryDate = (dayOfWeek) => {
  const today = new Date();
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayIndex = today.getDay();
  const targetIndex = daysOfWeek.indexOf(dayOfWeek.toLowerCase());
  
  let daysToAdd = targetIndex - todayIndex;
  
  // Eğer geçmiş günse, bir sonraki haftaya ekle
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  nextDate.setHours(0, 0, 0, 0);
  
  return nextDate;
}; 