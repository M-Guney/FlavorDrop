const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrderDetails,
  getUserOrders,
  getVendorOrders,
  updateOrderStatus,
  cancelOrder,
  confirmDelivery
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

// Kullanıcı siparişleri için rotalar
router.route('/')
  .post(protect, createOrder);

router.route('/user')
  .get(protect, getUserOrders);

router.route('/vendor')
  .get(protect, authorize('vendor', 'admin'), getVendorOrders);

router.route('/:id')
  .get(protect, getOrderDetails);

router.route('/:id/status')
  .put(protect, authorize('vendor', 'admin'), updateOrderStatus);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id/confirm-delivery')
  .put(protect, confirmDelivery);

module.exports = router; 