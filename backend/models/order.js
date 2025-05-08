const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      name: String,
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Miktar en az 1 olmalıdır']
      },
      price: {
        type: Number,
        required: true
      },
      specialInstructions: String
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Toplam tutar negatif olamaz']
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['nakit', 'kredi_karti', 'banka_havalesi', 'kapida_odeme', 'cuzdan']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['beklemede', 'tamamlandi', 'iade_edildi', 'iptal_edildi'],
    default: 'beklemede'
  },
  orderStatus: {
    type: String,
    required: true,
    enum: [
      'siparis_alindi', 
      'hazirlaniyor', 
      'teslimat_icin_hazir', 
      'teslimatta', 
      'teslim_edildi', 
      'iptal_edildi'
    ],
    default: 'siparis_alindi'
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Türkiye'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    deliveryInstructions: String
  },
  contactPhone: {
    type: String,
    required: true
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  deliveryPerson: {
    name: String,
    phone: String,
    vehicleInfo: String
  },
  orderNotes: String,
  isSubscriptionOrder: {
    type: Boolean,
    default: false
  },
  subscriptionDetails: {
    frequency: String, // 'günlük', 'haftalık', 'aylık'
    duration: Number, // Kaç gün, hafta veya ay
    nextDeliveryDate: Date
  },
  ratings: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  refundRequest: {
    status: {
      type: String,
      enum: ['yok', 'talep_edildi', 'işleniyor', 'onaylandi', 'reddedildi'],
      default: 'yok'
    },
    reason: String,
    requestDate: Date,
    resolvedDate: Date,
    refundAmount: Number
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

// İndirim ve vergiyi dahil ederek son tutarı hesapla
OrderSchema.pre('save', function(next) {
  this.finalAmount = 
    this.totalAmount + 
    this.deliveryFee + 
    this.taxAmount - 
    this.discountAmount;
  
  this.updatedAt = Date.now();
  next();
});

// Sipariş durumu güncelleme için
OrderSchema.methods.updateOrderStatus = function(newStatus, updateParams = {}) {
  this.orderStatus = newStatus;
  
  if (newStatus === 'teslimatta') {
    this.estimatedDeliveryTime = updateParams.estimatedTime || null;
    if (updateParams.deliveryPerson) {
      this.deliveryPerson = updateParams.deliveryPerson;
    }
  }
  
  if (newStatus === 'teslim_edildi') {
    this.actualDeliveryTime = Date.now();
  }
  
  return this.save();
};

// Teslimat tahmini sürelerini hesapla
OrderSchema.methods.calculateEstimatedDeliveryTime = function(baseTime = 30) {
  const estimatedMinutes = baseTime + (this.items.length * 5);
  const deliveryTime = new Date();
  deliveryTime.setMinutes(deliveryTime.getMinutes() + estimatedMinutes);
  
  this.estimatedDeliveryTime = deliveryTime;
  return this.estimatedDeliveryTime;
};

module.exports = mongoose.model('Order', OrderSchema); 