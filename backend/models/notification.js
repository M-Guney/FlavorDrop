const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'new_order',          // Yeni sipariş bildirimi
      'order_status',       // Sipariş durumu güncellemesi
      'recurring_order',    // Düzenli sipariş hatırlatması
      'vendor_message',     // Satıcıdan mesaj
      'customer_message',   // Müşteriden mesaj
      'system'              // Sistem bildirimi
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile'
  },
  actionUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: Date
});

// Okundu olarak işaretleme metodu
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = Date.now();
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema); 