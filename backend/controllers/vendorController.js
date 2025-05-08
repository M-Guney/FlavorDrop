const VendorProfile = require('../models/vendorProfile');
const MenuItem = require('../models/menuItem');
const User = require('../models/user');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Satıcı profili oluştur veya güncelle
// @route   POST /api/vendors/profile
// @access  Private
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
// @access  Private
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
  const { category, rating, name, menuItem } = req.query;
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

  // Önce menü öğeleri olan satıcıları bul
  let vendorsWithMenu = await MenuItem.distinct('vendor');
  let matchedMenuItems = [];
  
  // Menü içeriğine göre filtreleme 
  if (menuItem) {
    // Menü içeriğine göre satıcıları bul
    const menuItems = await MenuItem.find({
      $or: [
        { name: { $regex: menuItem, $options: 'i' } },
        { description: { $regex: menuItem, $options: 'i' } },
        { category: { $regex: menuItem, $options: 'i' } },
        { ingredients: { $in: [new RegExp(menuItem, 'i')] } }
      ]
    });
    
    // Eşleşen menü öğelerini sakla
    matchedMenuItems = menuItems;
    vendorsWithMenu = menuItems.map(item => item.vendor.toString());
  }
  
  // Menü öğesi olan tüm satıcıları getir
  const vendors = await VendorProfile.find({
    ...filter,
    $or: [
      { _id: { $in: vendorsWithMenu } },  // Menü eklemiş satıcılar
      { isVerified: true }                // Doğrulanmış satıcılar
    ]
  }).populate({
    path: 'user',
    select: 'name email'
  });

  // Satıcı verilerine eşleşen menü öğelerini ekle
  const vendorsWithMenuItems = vendors.map(vendor => {
    // Vendor objesini düz bir objeye dönüştür
    const vendorObj = vendor.toObject();
    
    // Eğer menü araması yapıldıysa, eşleşen menü öğelerini ekle
    if (menuItem && matchedMenuItems.length > 0) {
      vendorObj.matchedMenuItems = matchedMenuItems.filter(
        item => item.vendor.toString() === vendor._id.toString()
      );
    }
    
    return vendorObj;
  });

  res.status(200).json({
    success: true,
    count: vendors.length,
    data: vendorsWithMenuItems
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

// @desc    Satıcının müsaitlik bilgilerini günceller
// @route   PUT /api/vendors/profile/availability
// @access  Private (Sadece satıcılar)
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;
  
  // Müsaitlik formatının doğru olup olmadığını kontrol et
  if (!availability || !Array.isArray(availability)) {
    return next(
      new ErrorResponse('Müsaitlik bilgileri geçerli bir formatta değil', 400)
    );
  }
  
  // Satıcı profilini kontrol et
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Satıcı profili bulunamadı', 404)
    );
  }
  
  // Müsaitlik bilgilerini güncelle
  vendorProfile.availability = availability;
  await vendorProfile.save();
  
  res.status(200).json({
    success: true,
    data: vendorProfile.availability
  });
});

// @desc    Satıcının müsaitlik bilgilerini getirir
// @route   GET /api/vendors/profile/availability
// @access  Private (Sadece satıcılar)
exports.getAvailability = asyncHandler(async (req, res, next) => {
  // Satıcı profilini kontrol et
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Satıcı profili bulunamadı', 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: vendorProfile.availability
  });
});

// @desc    Kullanıcılar için satıcının müsaitlik bilgilerini getirir
// @route   GET /api/vendors/:id/availability
// @access  Public
exports.getVendorAvailability = asyncHandler(async (req, res, next) => {
  // Satıcı profilini kontrol et
  const vendorProfile = await VendorProfile.findById(req.params.id);
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Satıcı profili bulunamadı', 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: vendorProfile.availability
  });
});

// @desc    Resim yükleme (logo veya kapak fotoğrafı)
// @route   POST /api/vendors/upload
// @access  Private
exports.uploadVendorImage = asyncHandler(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorResponse('Lütfen bir resim yükleyin', 400));
  }
  
  // Satıcı profili kontrolünü kaldırıyoruz, kullanıcı kimliği ile işlem yapacağız
  // Eğer profil yoksa, oluşturulacak profil için resim yüklenebilir
  
  const file = req.files.image;
  const type = req.body.type; // "logo" veya "cover"
  
  // Dosya tipi kontrolü
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Lütfen bir resim dosyası yükleyin', 400));
  }
  
  // Dosya boyutu kontrolü
  const maxSize = type === 'logo' ? 1 * 1024 * 1024 : 2 * 1024 * 1024; // logo için 1MB, kapak için 2MB
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Lütfen ${maxSize / (1024 * 1024)}MB'dan küçük bir resim yükleyin`,
        400
      )
    );
  }
  
  // Dosya adını özelleştir
  const fileExtension = file.name.split('.').pop();
  file.name = `${type}_${req.user.id}_${Date.now()}.${fileExtension}`;
  
  // Dosyayı taşı
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Dosya yükleme hatası', 500));
    }
    
    // Satıcı profili varsa profili güncelle
    const imageUrl = `${process.env.FILE_UPLOAD_BASE_URL}/${file.name}`;
    
    const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
    
    if (vendorProfile) {
      if (type === 'logo') {
        vendorProfile.logo = imageUrl;
      } else if (type === 'cover') {
        vendorProfile.coverImage = imageUrl;
      }
      
      await vendorProfile.save();
    }
    
    res.status(200).json({
      success: true,
      imageUrl
    });
  });
}); 