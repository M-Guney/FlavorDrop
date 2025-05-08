const asyncHandler = require('../middleware/asyncHandler');
const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');

// @desc    Tüm değerlendirmeleri getir
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ status: 'approved' })
    .populate('user', 'name avatar')
    .populate('vendor', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const count = await Review.countDocuments({ status: 'approved' });

  res.json({
    reviews,
    page,
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Değerlendirme detayını getir
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('vendor', 'name')
    .populate('likes', 'name');

  if (review) {
    res.json(review);
  } else {
    res.status(404);
    throw new Error('Değerlendirme bulunamadı');
  }
});

// @desc    Yeni değerlendirme oluştur
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, vendorId, orderId, images } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    res.status(404);
    throw new Error('Satıcı bulunamadı');
  }

  // Kullanıcının daha önce bu satıcı için değerlendirme yapıp yapmadığını kontrol et
  const existingReview = await Review.findOne({
    user: req.user._id,
    vendor: vendorId,
    order: orderId
  });

  if (existingReview) {
    res.status(400);
    throw new Error('Bu sipariş için zaten bir değerlendirme yapmışsınız');
  }

  const review = new Review({
    user: req.user._id,
    vendor: vendorId,
    order: orderId,
    rating,
    comment,
    images: images || [],
    status: vendor.autoApproveReviews ? 'approved' : 'pending'
  });

  const createdReview = await review.save();

  // Otomatik onaylanırsa satıcı değerlendirme sayısını ve ortalama puanını güncelle
  if (vendor.autoApproveReviews) {
    await updateVendorRating(vendorId);
  }

  res.status(201).json(createdReview);
});

// @desc    Değerlendirmeyi güncelle
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, images } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Değerlendirme bulunamadı');
  }

  // Kullanıcının kendi değerlendirmesini güncelleyip güncellemediğini kontrol et
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu işlem için yetkiniz yok');
  }

  // Güncelleme işlemi için maksimum süreyi kontrol et (örn. 7 gün)
  const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation > 7 && req.user.role !== 'admin') {
    res.status(400);
    throw new Error('Değerlendirmeler yalnızca ilk 7 gün içinde düzenlenebilir');
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  
  if (images) {
    review.images = images;
  }
  
  // Onaylanmış bir değerlendirme güncellendiyse, tekrar onay sürecine girer
  if (review.status === 'approved') {
    const vendor = await Vendor.findById(review.vendor);
    review.status = vendor.autoApproveReviews ? 'approved' : 'pending';
  }

  const updatedReview = await review.save();

  // Eğer değerlendirme onaylandıysa ve derecesi değiştiyse, satıcı puanını güncelle
  if (updatedReview.status === 'approved' && review.rating !== rating) {
    await updateVendorRating(review.vendor);
  }

  res.json(updatedReview);
});

// @desc    Değerlendirmeyi sil
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Değerlendirme bulunamadı');
  }

  // Kullanıcının kendi değerlendirmesini silip silmediğini veya admin olup olmadığını kontrol et
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu işlem için yetkiniz yok');
  }

  await review.remove();
  
  // Satıcı puanını güncelle
  await updateVendorRating(review.vendor);

  res.json({ message: 'Değerlendirme silindi' });
});

// @desc    Satıcıya ait değerlendirmeleri getir
// @route   GET /api/reviews/vendor/:vendorId
// @access  Public
const getVendorReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || 'createdAt';
  const direction = req.query.direction === 'asc' ? 1 : -1;
  const filterRating = Number(req.query.rating) || 0;

  let query = { 
    vendor: req.params.vendorId,
    status: 'approved'
  };

  // Belirli bir puana göre filtreleme
  if (filterRating > 0) {
    query.rating = filterRating;
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = direction;

  const reviews = await Review.find(query)
    .populate('user', 'name avatar')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const count = await Review.countDocuments(query);

  // Derecelendirme dağılımını hesapla
  const ratingDistribution = await Review.aggregate([
    { $match: { vendor: mongoose.Types.ObjectId(req.params.vendorId), status: 'approved' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);

  const distribution = [0, 0, 0, 0, 0];
  ratingDistribution.forEach(item => {
    distribution[5 - item._id] = item.count;
  });

  res.json({
    reviews,
    page,
    pages: Math.ceil(count / limit),
    total: count,
    distribution
  });
});

// @desc    Kullanıcının değerlendirmelerini getir
// @route   GET /api/reviews/user
// @access  Private
const getUserReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user._id })
    .populate('vendor', 'name image')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const count = await Review.countDocuments({ user: req.user._id });

  res.json({
    reviews,
    page,
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Satıcı yanıtı ekle
// @route   PUT /api/reviews/:id/reply
// @access  Private/Vendor
const addVendorReply = asyncHandler(async (req, res) => {
  const { reply } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Değerlendirme bulunamadı');
  }

  // Yanıt ekleyen kişinin bu satıcıya ait olup olmadığını kontrol et
  const vendor = await Vendor.findOne({ _id: review.vendor, user: req.user._id });
  
  if (!vendor && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu işlem için yetkiniz yok');
  }

  review.vendorReply = {
    content: reply,
    createdAt: Date.now()
  };

  const updatedReview = await review.save();
  
  res.json(updatedReview);
});

// @desc    Değerlendirmeyi beğen/beğenme
// @route   PUT /api/reviews/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Değerlendirme bulunamadı');
  }

  const alreadyLiked = review.likes.includes(req.user._id);

  if (alreadyLiked) {
    // Beğeniyi kaldır
    review.likes = review.likes.filter(
      like => like.toString() !== req.user._id.toString()
    );
  } else {
    // Beğeni ekle
    review.likes.push(req.user._id);
  }

  await review.save();
  
  res.json({ likes: review.likes, likesCount: review.likes.length });
});

// @desc    Değerlendirme durumunu güncelle (onay/red)
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Değerlendirme bulunamadı');
  }

  review.status = status;
  
  if (status === 'rejected') {
    review.rejectionReason = rejectionReason || 'İçerik politikamıza aykırı';
  }

  const updatedReview = await review.save();

  // Durum değiştiyse satıcı puanını güncelle
  if (status === 'approved' || review.status === 'approved') {
    await updateVendorRating(review.vendor);
  }

  res.json(updatedReview);
});

// @desc    Değerlendirme istatistiklerini getir
// @route   GET /api/reviews/stats/:vendorId
// @access  Public
const getReviewStatistics = asyncHandler(async (req, res) => {
  const vendorId = req.params.vendorId;

  // Değerlendirme sayılarını ve ortalama puanı hesapla
  const stats = await Review.aggregate([
    { $match: { vendor: mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    { 
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingSum: { $sum: '$rating' }
      }
    }
  ]);

  // Her puan için değerlendirme sayısını hesapla
  const ratingDistribution = await Review.aggregate([
    { $match: { vendor: mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);

  // Son eklenen değerlendirmeleri getir
  const recentReviews = await Review.find({ 
    vendor: vendorId, 
    status: 'approved' 
  })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(3);

  const distribution = [0, 0, 0, 0, 0];
  ratingDistribution.forEach(item => {
    distribution[5 - item._id] = item.count;
  });

  res.json({
    totalReviews: stats.length > 0 ? stats[0].totalCount : 0,
    averageRating: stats.length > 0 ? stats[0].averageRating : 0,
    distribution,
    recentReviews
  });
});

// Yardımcı fonksiyon: Satıcı değerlendirmesini güncelle
const updateVendorRating = async (vendorId) => {
  const stats = await Review.aggregate([
    { $match: { vendor: mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    { 
      $group: {
        _id: null,
        ratingAvg: { $avg: '$rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  await Vendor.findByIdAndUpdate(vendorId, {
    rating: stats.length > 0 ? stats[0].ratingAvg : 0,
    numReviews: stats.length > 0 ? stats[0].ratingCount : 0
  });
};

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getVendorReviews,
  getUserReviews,
  addVendorReply,
  toggleLike,
  updateReviewStatus,
  getReviewStatistics
}; 