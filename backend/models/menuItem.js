const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true,
    maxlength: [100, 'Ürün adı 100 karakterden uzun olamaz']
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması zorunludur'],
    trim: true,
    maxlength: [1000, 'Açıklama 1000 karakterden uzun olamaz']
  },
  price: {
    type: Number,
    required: [true, 'Fiyat zorunludur'],
    min: [0, 'Fiyat negatif olamaz']
  },
  image: {
    type: String,
    default: 'default-food.jpg'
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    enum: [
      'Başlangıçlar',
      'Ana Yemekler',
      'Tatlılar',
      'İçecekler',
      'Kahvaltı',
      'Sandviçler',
      'Salatalar',
      'Çorbalar',
      'Mezeler',
      'Fast Food',
      'Özel Menüler',
      'Diğer'
    ]
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  spicyLevel: {
    type: Number,
    min: 0,
    max: 3,
    default: 0 // 0: Acısız, 1: Az Acılı, 2: Orta Acılı, 3: Çok Acılı
  },
  preparationTime: {
    type: Number,
    default: 15,
    min: [5, 'Hazırlama süresi en az 5 dakika olmalıdır']
  },
  featured: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  ingredients: {
    type: [String],
    default: []
  },
  allergens: {
    type: [String],
    default: []
  },
  nutritionalInfo: {
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    }
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Fiyat hesaplama metodu (indirimleri dahil eder)
MenuItemSchema.methods.getDiscountedPrice = function() {
  if (this.discountPercentage > 0) {
    return this.price - (this.price * this.discountPercentage / 100);
  }
  return this.price;
};

// Değerlendirme güncelleme
MenuItemSchema.methods.updateRatingStats = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
  this.averageRating = (sum / this.ratings.length).toFixed(1);
  this.totalRatings = this.ratings.length;
};

// "updatedAt" değerini otomatik güncelle
MenuItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MenuItem', MenuItemSchema); 