const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/reviewController');
const { protect, admin, vendor } = require('../middleware/authMiddleware');

// Değerlendirme istatistikleri
router.get('/stats/:vendorId', getReviewStatistics);

// Değerlendirmeyi beğenme/beğenmeme
router.put('/:id/like', protect, toggleLike);

// Satıcı yanıtı ekleme
router.put('/:id/reply', protect, vendor, addVendorReply);

// Değerlendirme durumunu güncelleme (onaylama/reddetme için admin)
router.put('/:id/status', protect, admin, updateReviewStatus);

// Kullanıcıya göre değerlendirmeleri alma
router.get('/user', protect, getUserReviews);

// Satıcıya göre değerlendirmeleri alma
router.get('/vendor/:vendorId', getVendorReviews);

// Değerlendirme alma, oluşturma
router.route('/')
  .get(getReviews)
  .post(protect, createReview);

// Belirli bir değerlendirmeyi alma, güncelleme, silme
router.route('/:id')
  .get(getReviewById)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router; 