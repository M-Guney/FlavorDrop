const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  updatePassword,
  checkAdminAuth,
  getAdminStats,
  getUserStatistics,
  getUsers,
  getUserById,
  toggleUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Kimlik doğrulama rotaları
router.post('/register', registerUser);
router.post('/login', loginUser);

// Profil rotaları
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Şifre değiştirme rotası
router.put('/password', protect, updatePassword);

// Admin rotaları
router.get('/check-admin', protect, checkAdminAuth);
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.get('/admin/user-statistics', protect, authorize('admin'), getUserStatistics);
router.get('/admin/users', protect, authorize('admin'), getUsers);
router.get('/admin/users/:id', protect, authorize('admin'), getUserById);
router.patch('/admin/users/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

module.exports = router; 