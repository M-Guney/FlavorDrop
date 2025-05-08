const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReservation,
  getMyReservations,
  getReservationById,
  updateReservationStatus,
  cancelReservation
} = require('../controllers/reservationController');

// Tüm kullanıcılar (giriş yapmış olmak şartıyla)
router.route('/')
  .post(protect, createReservation)
  .get(protect, getMyReservations);

router.route('/:id')
  .get(protect, getReservationById);

router.route('/:id/status')
  .put(protect, authorize('vendor'), updateReservationStatus);

router.route('/:id/cancel')
  .put(protect, cancelReservation);

module.exports = router; 