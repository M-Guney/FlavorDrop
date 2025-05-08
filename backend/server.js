const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Middleware'ler
const { protect } = require('./middleware/auth');

// Route dosyaları
const vendorRoutes = require('./routes/vendorRoutes');
const authRoutes = require('./routes/authRoutes');

// Çevre değişkenlerini yükle
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı (MongoDB URI .env dosyasından okunacak)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food-booking')
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);

// Basit hata mesajı döndüren middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Sayfa bulunamadı'
  });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Sunucu hatası'
  });
});

// Port dinleme
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`)); 