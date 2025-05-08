const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const menuRoutes = require('./routes/menuRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Ana API yolları
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes); 