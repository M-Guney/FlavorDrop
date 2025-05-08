const Review = require('../models/review');
const User = require('../models/user');
const Vendor = require('../models/vendorProfile');
const MenuItem = require('../models/menuItem');
const Order = require('../models/order');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Tüm değerlendirmeleri getir
// @route   GET /api/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  let query;

  // Filtreleme
  const { targetType, targetId, user, minRating, status } = req.query;
  const filter = {};

  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;
  if (user) filter.user = user;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (status) filter.status = status;

  // İzin verilen statüler (admin değilse sadece yayınlanmış içerikleri görebilir)
  if (!req.user || req.user.role !== 'admin') {
    filter.status = 'published';
  }

  // Sorgu oluştur
  query = Review.find(filter)
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  // Sayfalandırma
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Review.countDocuments(filter);

  query = query.skip(startIndex).limit(limit);

  // Sorguyu çalıştır
  const reviews = await query;

  // Sayfalandırma sonucu
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination,
    data: reviews
  });
});

// @desc    Belirli bir hedef için değerlendirme istatistiklerini getir
// @route   GET /api/reviews/stats/:targetType/:targetId
// @access  Public
exports.getReviewStats = asyncHandler(async (req, res, next) => {
  const { targetType, targetId } = req.params;

  // Hedefin var olup olmadığını kontrol et
  let target;
  
  if (targetType === 'vendor') {
    target = await Vendor.findById(targetId);
  } else if (targetType === 'menuItem') {
    target = await MenuItem.findById(targetId);
  }

  if (!target) {
    return next(
      new ErrorResponse(`${targetType === 'vendor' ? 'Restoran' : 'Menü öğesi'} bulunamadı`, 404)
    );
  }

  // İstatistikleri hesapla
  const stats = await Review.aggregate([
    {
      $match: {
        targetType: targetType,
        targetId: mongoose.Types.ObjectId(targetId),
        status: 'published'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        ratingDistribution: {
          '5': {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 5] }
              }
            }
          },
          '4': {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 4] }
              }
            }
          },
          '3': {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 3] }
              }
            }
          },
          '2': {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 2] }
              }
            }
          },
          '1': {
            $size: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $eq: ['$$rating', 1] }
              }
            }
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats.length > 0
      ? stats[0]
      : {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0
          }
        }
  });
});

// @desc    Tek bir değerlendirmeyi getir
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('orderRef', 'orderNumber');

  if (!review) {
    return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
  }

  // Eğer değerlendirme yayınlanmamışsa ve kullanıcı admin veya değerlendirmeyi yazan kişi değilse gösterme
  if (
    review.status !== 'published' &&
    (!req.user ||
      (req.user.role !== 'admin' && 
       req.user._id.toString() !== review.user._id.toString()))
  ) {
    return next(new ErrorResponse('Bu değerlendirmeyi görüntüleme izniniz yok', 403));
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Yeni bir değerlendirme oluştur
// @route   POST /api/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;
  
  const { targetType, targetId, orderRef } = req.body;

  // Kullanıcının bu hedef için daha önce değerlendirme yapıp yapmadığını kontrol et
  const existingReview = await Review.findOne({ 
    user: req.user.id, 
    targetType, 
    targetId 
  });

  if (existingReview) {
    return next(new ErrorResponse('Bu öğe için zaten bir değerlendirme yapmışsınız', 400));
  }

  // Hedefin var olup olmadığını kontrol et
  let target;
  
  if (targetType === 'vendor') {
    target = await Vendor.findById(targetId);
  } else if (targetType === 'menuItem') {
    target = await MenuItem.findById(targetId);
  }

  if (!target) {
    return next(
      new ErrorResponse(`${targetType === 'vendor' ? 'Restoran' : 'Menü öğesi'} bulunamadı`, 404)
    );
  }

  // Siparişin var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
  const order = await Order.findById(orderRef);
  
  if (!order) {
    return next(new ErrorResponse('Sipariş bulunamadı', 404));
  }
  
  if (order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Bu siparişe ait değerlendirme yapma yetkiniz yok', 403));
  }

  // Siparişte bu öğenin/restoranın olup olmadığını kontrol et
  if (targetType === 'vendor' && order.vendor.toString() !== targetId) {
    return next(new ErrorResponse('Bu sipariş bu restorana ait değil', 400));
  } else if (targetType === 'menuItem') {
    const itemExists = order.items.some(item => item.menuItem.toString() === targetId);
    if (!itemExists) {
      return next(new ErrorResponse('Bu sipariş bu menü öğesini içermiyor', 400));
    }
  }

  // Değerlendirmeyi oluştur
  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Değerlendirmeyi güncelle
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
  }

  // Değerlendirmenin sahibi değilse güncellemeye izin verme
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Bu değerlendirmeyi güncelleme izniniz yok', 403));
  }

  // User ID ve targetType/targetId değiştirilmesin
  delete req.body.user;
  delete req.body.targetType;
  delete req.body.targetId;
  delete req.body.orderRef;

  // Sadece belirli alanların güncellenmesine izin ver
  const allowedFields = ['rating', 'title', 'content', 'photos', 'tags'];
  
  // Admin dışındakiler status değiştiremez
  if (req.user.role !== 'admin') {
    delete req.body.status;
  }
  
  // Sadece izin verilen alanları güncelle
  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }
  
  // Admin status değiştirebilir
  if (req.user.role === 'admin' && req.body.status) {
    updateData.status = req.body.status;
  }

  review = await Review.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Değerlendirmeyi sil
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
  }

  // Değerlendirmenin sahibi değilse silmeye izin verme
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Bu değerlendirmeyi silme izniniz yok', 403));
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Değerlendirmeye yanıt ver (restoran sahibi)
// @route   POST /api/reviews/:id/reply
// @access  Private/Vendor
exports.addVendorReply = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
  }

  // Değerlendirmenin hedefi bir restoran mu ve yanıt veren kişi o restoranın sahibi mi kontrol et
  if (review.targetType !== 'vendor') {
    return next(new ErrorResponse('Sadece restoran değerlendirmelerine yanıt verilebilir', 400));
  }

  const vendor = await Vendor.findById(review.targetId);
  
  if (!vendor) {
    return next(new ErrorResponse('Restoran bulunamadı', 404));
  }
  
  if (vendor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Bu değerlendirmeye yanıt verme izniniz yok', 403));
  }

  // Yanıtı ekle
  review.vendorReply = {
    content: req.body.content,
    date: Date.now()
  };

  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Değerlendirmeyi beğen/beğenme
// @route   POST /api/reviews/:id/like
// @access  Private
exports.toggleLike = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
  }

  // Değerlendirme yayınlanmamışsa beğenmeye izin verme
  if (review.status !== 'published') {
    return next(new ErrorResponse('Yayınlanmamış değerlendirmeyi beğenemezsiniz', 400));
  }

  // Kullanıcı daha önce beğenmiş mi kontrol et
  const likedIndex = review.likes.findIndex(
    id => id.toString() === req.user.id
  );

  // Eğer daha önce beğenmişse, beğeniyi kaldır
  if (likedIndex !== -1) {
    review.likes.splice(likedIndex, 1);
  } else {
    // Eğer beğenmemişse, beğeni ekle
    review.likes.push(req.user.id);
  }

  await review.save();

  res.status(200).json({
    success: true,
    liked: likedIndex === -1, // Eğer eklediyse true, kaldırdıysa false
    likeCount: review.likes.length,
    data: review
  });
});

// @desc    Değerlendirme durumunu güncelle (admin)
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
exports.updateReviewStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !['pending', 'published', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Geçerli bir durum belirtmelisiniz', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
  }

  review.status = status;
  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
}); 