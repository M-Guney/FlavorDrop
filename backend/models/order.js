const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      options: [
        {
          name: String,
          choice: String,
          priceAdjustment: Number
        }
      ],
      specialInstructions: String,
      totalItemPrice: {
        type: Number,
        required: true
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  orderType: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  recurring: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly']
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    timeSlot: String,
    nextDeliveryDate: Date,
    endDate: Date,
    active: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'online'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  vendorNotification: {
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  customerNotification: {
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  estimatedDeliveryTime: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  rating: {
    stars: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Sipariş tamamlandığında completedAt alanını güncelle
OrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    } else if (this.status === 'cancelled' && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

// Müşteri ve satıcı için sipariş özeti
OrderSchema.methods.getSummary = function() {
  return {
    id: this._id,
    items: this.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    totalAmount: this.totalAmount,
    status: this.status,
    createdAt: this.createdAt
  };
};

// Tekrarlanan sipariş kontrolü
OrderSchema.statics.checkForRecurringOrders = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Bir sonraki teslimat günü bugün veya dün olan aktif tekrarlanan siparişleri bul
  // (Dün olanlar işlenmemiş olabilir)
  const recurringOrders = await this.find({
    'orderType': 'recurring',
    'recurring.active': true,
    'recurring.nextDeliveryDate': { $lte: tomorrow },
    'status': { $nin: ['cancelled', 'completed'] }
  }).populate('user vendor');
  
  return recurringOrders;
};

module.exports = mongoose.model('Order', OrderSchema); 