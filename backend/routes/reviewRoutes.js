const express = require('express');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  addVendorReply,
  toggleLike,
  getReviewStats,
  updateReviewStatus
} = require('../controllers/reviewController');

const router = express.Router();

// Yetkilendirme middleware'i
const { protect, authorize } = require('../middleware/auth');

// İstatistikler rotası
router.route('/stats/:targetType/:targetId').get(getReviewStats);

// Beğeni rotası
router.route('/:id/like').post(protect, toggleLike);

// Restoran yanıtı rotası
router.route('/:id/reply').post(protect, authorize('vendor', 'admin'), addVendorReply);

// Değerlendirme durumu güncelleme rotası (sadece admin)
router.route('/:id/status').put(protect, authorize('admin'), updateReviewStatus);

// Ana rotalar
router
  .route('/')
  .get(getReviews)
  .post(protect, createReview);

router
  .route('/:id')
  .get(getReview)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router; 