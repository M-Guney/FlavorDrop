const express = require('express');
const userRoutes = require('./userRoutes');
const vendorRoutes = require('./vendorRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

// API rotalarını bağlama
router.use('/api/users', userRoutes);
router.use('/api/vendors', vendorRoutes);
router.use('/api/cart', cartRoutes);
router.use('/api/orders', orderRoutes);

module.exports = router; 