const mongoose = require('mongoose');

// Abonelik planı şeması
const subscriptionSchema = new mongoose.Schema({
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
  menuItems: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    _id: false
  }],
  deliveryDays: {
    // Haftanın günleri (1: Pazartesi, 2: Salı, ...7: Pazar)
    type: [Number],
    required: true,
    validate: {
      validator: function(array) {
        return array.every(day => day >= 1 && day <= 7);
      },
      message: "Geçersiz gün değeri. 1 ile 7 arasında olmalıdır."
    }
  },
  deliveryTime: {
    // Örneğin "12:00" veya "18:30" şeklinde
    type: String,
    required: true
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  totalWeeklyPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 