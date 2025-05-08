const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const colors = require('colors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

// Middleware'ler
const { protect } = require('./middleware/auth');

// Route dosyaları
const vendorRoutes = require('./routes/vendorRoutes');
const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Çevre değişkenlerini yükle
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS ayarları
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// MongoDB bağlantısı (MongoDB URI .env dosyasından okunacak)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food-booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı');
  
  // Routes
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/cart', cartRoutes);

  // API rotalarını kullan
  app.use(routes);

  // Hata yönetimi middleware'i
  app.use(errorHandler);

  // Port dinleme
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
})
.catch(err => {
  console.error('MongoDB bağlantı hatası:', err);
  process.exit(1);
}); 