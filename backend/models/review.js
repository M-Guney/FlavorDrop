const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['vendor', 'menuItem'],
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  rating: {
    type: Number,
    required: [true, 'Lütfen 1-5 arası bir puan verin'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Lütfen bir başlık girin'],
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: [true, 'Lütfen değerlendirme metni girin'],
    trim: true,
    maxlength: 1000
  },
  photos: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\//.test(v);
      },
      message: 'Geçerli bir URL girin'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  orderRef: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected'],
    default: 'pending'
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  vendorReply: {
    content: {
      type: String,
      trim: true,
      maxlength: 500
    },
    date: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Değerlendirmeyi silmeden önce ortalama puanı güncelleme için targetId ve targetType indeksi oluştur
ReviewSchema.index({ targetType: 1, targetId: 1 });

// Bir kullanıcının aynı hedef için birden fazla değerlendirme yapmasını engelle
ReviewSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Beğeni sayısını sanal alan olarak ekle
ReviewSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Pre-save middleware işlevi
ReviewSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Restoran veya menü öğesi değerlendirmelerini bul
ReviewSchema.statics.findByTarget = function(targetType, targetId) {
  return this.find({
    targetType: targetType,
    targetId: targetId
  }).sort({ createdAt: -1 }).populate('user', 'name profileImage');
};

// Hedef için ortalama puanı hesapla
ReviewSchema.statics.calculateAverageRating = async function(targetType, targetId) {
  const result = await this.aggregate([
    { 
      $match: {
        targetType: targetType,
        targetId: targetId,
        status: 'published'
      }
    },
    {
      $group: {
        _id: '$targetId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  const stats = result.length > 0 ? result[0] : { averageRating: 0, reviewCount: 0 };
  return {
    averageRating: Math.round(stats.averageRating * 10) / 10, // 1 ondalık basamağa yuvarla
    reviewCount: stats.reviewCount
  };
};

// Beğeni ekle/kaldır
ReviewSchema.methods.toggleLike = function(userId) {
  const userIndex = this.likes.indexOf(userId);
  
  if (userIndex === -1) {
    // Beğeni ekle
    this.likes.push(userId);
  } else {
    // Beğeni kaldır
    this.likes.splice(userIndex, 1);
  }
  
  return this.save();
};

// Restoran yanıtı ekle
ReviewSchema.methods.addVendorReply = function(comment) {
  const isEditing = this.vendorReply && this.vendorReply.content;
  
  this.vendorReply = {
    content,
    date: Date.now(),
    isEdited: isEditing
  };
  
  return this.save();
};

module.exports = mongoose.model('Review', ReviewSchema); 