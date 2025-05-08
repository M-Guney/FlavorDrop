const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Miktar en az 1 olmalıdır']
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    maxlength: [200, 'Notlar 200 karakterden uzun olamaz']
  }
});

const CartSchema = new mongoose.Schema({
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
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 gün sonra otomatik silinir
  }
});

// Sepet tutarını hesapla
CartSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

CartSchema.set('toJSON', { virtuals: true });
CartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', CartSchema); 