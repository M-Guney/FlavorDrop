const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  createUpdateVendorProfile, 
  getMyVendorProfile,
  getVendors,
  getVendorById,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getVendorMenu,
  getMyMenu,
  updateAvailability,
  getAvailability
} = require('../controllers/vendorController');

// Satıcı profili rotaları
router.route('/profile')
  .post(protect, authorize('vendor'), createUpdateVendorProfile)
  .get(protect, authorize('vendor'), getMyVendorProfile);

// Satıcı müsait günler rotaları
router.route('/profile/availability')
  .put(protect, authorize('vendor'), updateAvailability)
  .get(protect, authorize('vendor'), getAvailability);

// Satıcı menü rotaları
router.route('/menu')
  .post(protect, authorize('vendor'), addMenuItem);

router.route('/menu/:id')
  .put(protect, authorize('vendor'), updateMenuItem)
  .delete(protect, authorize('vendor'), deleteMenuItem);

router.route('/my-menu')
  .get(protect, authorize('vendor'), getMyMenu);

// Genel satıcı rotaları
router.route('/')
  .get(getVendors);

router.route('/:id')
  .get(getVendorById);

router.route('/:id/menu')
  .get(getVendorMenu);

module.exports = router;
