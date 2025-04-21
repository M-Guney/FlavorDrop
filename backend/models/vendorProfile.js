const mongoose = require('mongoose');
// const slugify = require('slugify'); // Geçici olarak devre dışı bırakıldı

// Availability için alt şema (Müsaitlik gün yapısı)
const AvailabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Gün adı zorunludur'],
    enum: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    default: "09:00",
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Geçerli bir saat formatı giriniz (HH:MM)'
    ]
  },
  closeTime: {
    type: String,
    default: "22:00",
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Geçerli bir saat formatı giriniz (HH:MM)'
    ]
  },
  maxOrdersPerSlot: {
    type: Number,
    default: 3,
    min: 1
  },
  slotDurationMinutes: {
    type: Number,
    default: 30,
    min: 15,
    max: 120
  }
}, { _id: true });

const VendorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'İşletme adı zorunludur'],
    trim: true,
    maxlength: [100, 'İşletme adı 100 karakterden uzun olamaz']
  },
  slug: String, // Slug alanı korundu ama otomatik oluşturulmayacak
  description: {
    type: String,
    required: [true, 'İşletme açıklaması zorunludur'],
    maxlength: [1000, 'Açıklama 1000 karakterden uzun olamaz']
  },
  logo: {
    type: String,
    default: 'no-photo.jpg'
  },
  coverImage: {
    type: String,
    default: 'no-cover.jpg'
  },
  address: {
    street: {
      type: String,
      required: [true, 'Sokak adresi zorunludur']
    },
    city: {
      type: String,
      required: [true, 'Şehir zorunludur']
    },
    state: {
      type: String,
      required: [true, 'İlçe/Bölge zorunludur']
    },
    zipCode: {
      type: String,
      required: [true, 'Posta kodu zorunludur']
    },
    country: {
      type: String,
      required: [true, 'Ülke zorunludur'],
      default: 'Türkiye'
    }
  },
  cuisine: {
    type: String,
    required: [true, 'Mutfak türü zorunludur'],
    default: 'Türk Mutfağı'
  },
  phoneNumber: {
    type: String,
    required: [true, 'Telefon numarası zorunludur'],
    match: [
      /^(\+?\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
      'Lütfen geçerli bir telefon numarası giriniz'
    ]
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir e-posta adresi giriniz'
    ]
  },
  website: String,
  categories: {
    type: [String],
    required: [true, 'En az bir kategori seçilmelidir'],
    enum: [
      'Türk Mutfağı',
      'Dünya Mutfağı',
      'Fast Food',
      'Deniz Ürünleri',
      'Vejetaryen',
      'Vegan',
      'Tatlılar',
      'İçecekler',
      'Kahvaltı',
      'Öğle Yemeği',
      'Akşam Yemeği',
      'Sokak Lezzetleri',
      'Pasta ve Börek',
      'Diğer'
    ]
  },
  rating: {
    type: Number,
    min: [1, 'Değerlendirme en az 1 olmalıdır'],
    max: [5, 'Değerlendirme en fazla 5 olabilir'],
    default: 1
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isSubscriptionAvailable: {
    type: Boolean,
    default: false
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  estimatedDeliveryTime: {
    type: Number,
    default: 45,
    min: [15, 'Tahmini teslimat süresi en az 15 dakika olmalıdır']
  },
  openingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    }
  },
  tags: [String],
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  availability: {
    type: [AvailabilitySchema],
    default: [
      { day: 'Pazartesi', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 },
      { day: 'Salı', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 },
      { day: 'Çarşamba', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 },
      { day: 'Perşembe', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 },
      { day: 'Cuma', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 },
      { day: 'Cumartesi', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 },
      { day: 'Pazar', isOpen: true, openTime: '09:00', closeTime: '22:00', maxOrdersPerSlot: 3, slotDurationMinutes: 30 }
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Slug oluştur - devre dışı bırakıldı
/*
VendorProfileSchema.pre('save', function(next) {
  this.slug = slugify(this.businessName, { lower: true });
  next();
});
*/

// Slug yerine manuel bir işlev ekleyelim
VendorProfileSchema.pre('save', function(next) {
  if (!this.slug) {
    // Basit bir slug oluşturma fonksiyonu
    this.slug = this.businessName
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')      // Boşlukları tire ile değiştir
      .replace(/[^\w\-]+/g, '')  // Alfanümerik olmayan karakterleri kaldır
      .replace(/\-\-+/g, '-')    // Birden fazla tireyi tek tireye dönüştür
      .replace(/^-+/, '')        // Başlangıçtaki tireleri kaldır
      .replace(/-+$/, '');       // Sondaki tireleri kaldır
  }
  next();
});

// Sanal alan: menü öğeleri
VendorProfileSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'vendor',
  justOne: false
});

module.exports = mongoose.model('VendorProfile', VendorProfileSchema); 