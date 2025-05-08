const VendorProfile = require('../models/vendorProfile');
const MenuItem = require('../models/menuItem');
const User = require('../models/user');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Satıcı profili oluştur veya güncelle
// @route   POST /api/vendors/profile
// @access  Private (Sadece satıcılar)
exports.createUpdateVendorProfile = asyncHandler(async (req, res, next) => {
  const {
    businessName,
    description,
    address,
    phoneNumber,
    categories,
    openingHours
  } = req.body;

  let vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (vendorProfile) {
    // Profil güncelleme
    vendorProfile = await VendorProfile.findOneAndUpdate(
      { user: req.user.id },
      { 
        businessName,
        description,
        address,
        phoneNumber,
        categories: Array.isArray(categories) ? categories : categories.split(','),
        openingHours
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      data: vendorProfile
    });
  }

  // Yeni profil oluşturma
  vendorProfile = await VendorProfile.create({
    user: req.user.id,
    businessName,
    description,
    address,
    phoneNumber,
    categories: Array.isArray(categories) ? categories : categories.split(','),
    openingHours
  });

  res.status(201).json({
    success: true,
    data: vendorProfile
  });
});

// @desc    Kendi satıcı profilini görüntüle
// @route   GET /api/vendors/profile
// @access  Private (Sadece satıcılar)
exports.getMyVendorProfile = asyncHandler(async (req, res, next) => {
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });

  if (!vendorProfile) {
    return next(
      new ErrorResponse('Bu kullanıcı için satıcı profili bulunamadı', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: vendorProfile
  });
});

// @desc    Tüm satıcıları listele
// @route   GET /api/vendors
// @access  Public
exports.getVendors = asyncHandler(async (req, res, next) => {
  // Filtreleme için
  const { category, rating, name } = req.query;
  const filter = {};

  if (category) {
    filter.categories = { $in: [category] };
  }

  if (rating) {
    filter.rating = { $gte: parseFloat(rating) };
  }

  if (name) {
    filter.businessName = { $regex: name, $options: 'i' };
  }

  // Sadece onaylanmış satıcıları göster
  filter.isVerified = true;

  const vendors = await VendorProfile.find(filter).populate({
    path: 'user',
    select: 'name email'
  });

  res.status(200).json({
    success: true,
    count: vendors.length,
    data: vendors
  });
});

// @desc    Satıcı detaylarını görüntüle
// @route   GET /api/vendors/:id
// @access  Public
exports.getVendorById = asyncHandler(async (req, res, next) => {
  const vendor = await VendorProfile.findById(req.params.id).populate({
    path: 'user',
    select: 'name email'
  });

  if (!vendor) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li satıcı bulunamadı`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: vendor
  });
});

// @desc    Menü öğesi ekle
// @route   POST /api/vendors/menu
// @access  Private (Sadece satıcılar)
exports.addMenuItem = asyncHandler(async (req, res, next) => {
  // Önce satıcı profilinin olup olmadığını kontrol et
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });

  if (!vendorProfile) {
    return next(
      new ErrorResponse('Önce bir satıcı profili oluşturmalısınız', 400)
    );
  }

  const {
    name,
    description,
    price,
    category,
    image,
    isAvailable,
    isVegetarian,
    isVegan,
    isGlutenFree,
    spicyLevel,
    ingredients,
    allergens
  } = req.body;

  const menuItem = await MenuItem.create({
    vendor: vendorProfile._id,
    name,
    description,
    price,
    category,
    image: image || 'default-food.jpg',
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    isVegetarian: isVegetarian || false,
    isVegan: isVegan || false,
    isGlutenFree: isGlutenFree || false,
    spicyLevel: spicyLevel || 0,
    ingredients: ingredients || [],
    allergens: allergens || []
  });

  res.status(201).json({
    success: true,
    data: menuItem
  });
});

// @desc    Menü öğesini güncelle
// @route   PUT /api/vendors/menu/:id
// @access  Private (Sadece satıcılar)
exports.updateMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li menü öğesi bulunamadı`, 404)
    );
  }

  // Satıcı yetkisini kontrol et
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Satıcı profili bulunamadı', 404)
    );
  }

  // Sadece kendi menü öğesini güncelleyebilir
  if (menuItem.vendor.toString() !== vendorProfile._id.toString()) {
    return next(
      new ErrorResponse('Bu menü öğesini güncelleme yetkiniz yok', 403)
    );
  }

  const updatedMenuItem = await MenuItem.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedMenuItem
  });
});

// @desc    Menü öğesini sil
// @route   DELETE /api/vendors/menu/:id
// @access  Private (Sadece satıcılar)
exports.deleteMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li menü öğesi bulunamadı`, 404)
    );
  }

  // Satıcı yetkisini kontrol et
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Satıcı profili bulunamadı', 404)
    );
  }

  // Sadece kendi menü öğesini silebilir
  if (menuItem.vendor.toString() !== vendorProfile._id.toString()) {
    return next(
      new ErrorResponse('Bu menü öğesini silme yetkiniz yok', 403)
    );
  }

  await menuItem.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Satıcının menü öğelerini listele
// @route   GET /api/vendors/:id/menu
// @access  Public
exports.getVendorMenu = asyncHandler(async (req, res, next) => {
  const vendorId = req.params.id;
  
  // Önce satıcının var olup olmadığını kontrol et
  const vendorExists = await VendorProfile.exists({ _id: vendorId });
  
  if (!vendorExists) {
    return next(
      new ErrorResponse(`${vendorId} ID'li satıcı bulunamadı`, 404)
    );
  }
  
  const menuItems = await MenuItem.find({ 
    vendor: vendorId,
    isAvailable: true
  });
  
  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems
  });
});

// @desc    Satıcının kendi menüsünü görüntüle (kullanılabilir olmayanlar dahil)
// @route   GET /api/vendors/my-menu
// @access  Private (Sadece satıcılar)
exports.getMyMenu = asyncHandler(async (req, res, next) => {
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });

  if (!vendorProfile) {
    return next(
      new ErrorResponse('Bu kullanıcı için satıcı profili bulunamadı', 404)
    );
  }

  const menuItems = await MenuItem.find({ vendor: vendorProfile._id });
  
  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems
  });
});

// @desc    Satıcının müsait günlerini güncelle
// @route   PUT /api/vendors/profile/availability
// @access  Private (Sadece satıcılar)
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });

  if (!vendorProfile) {
    return next(
      new ErrorResponse('Bu kullanıcı için satıcı profili bulunamadı', 404)
    );
  }

  const { availability } = req.body;

  // Gönderilen availability verisini doğrula
  if (!Array.isArray(availability)) {
    return next(
      new ErrorResponse('Müsait günler listesi geçerli bir dizi olmalıdır', 400)
    );
  }

  // Availability dizisindeki her günün gerekli alanları içerdiğinden emin ol
  for (let i = 0; i < availability.length; i++) {
    const day = availability[i];
    
    if (!day.day || typeof day.isOpen !== 'boolean' || !day.openTime || !day.closeTime) {
      return next(
        new ErrorResponse(`Gün #${i+1} için gerekli tüm alanları doldurun (day, isOpen, openTime, closeTime)`, 400)
      );
    }
  }

  // Sadece müsait günleri güncelle, diğer alanları değiştirme
  await VendorProfile.findOneAndUpdate(
    { user: req.user.id },
    { availability: availability },
    { new: true, runValidators: false }
  );

  res.status(200).json({
    success: true,
    data: availability
  });
});

// @desc    Satıcının müsait günlerini görüntüle
// @route   GET /api/vendors/profile/availability
// @access  Private (Sadece satıcılar)
exports.getAvailability = asyncHandler(async (req, res, next) => {
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });

  if (!vendorProfile) {
    return next(
      new ErrorResponse('Bu kullanıcı için satıcı profili bulunamadı', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: vendorProfile.availability || []
  });
}); 