const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vendor'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    images: [
      {
        type: String
      }
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    vendorReply: {
      content: {
        type: String
      },
      createdAt: {
        type: Date
      }
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Bir kullanıcı bir siparişe sadece bir değerlendirme yapabilir
reviewSchema.index({ user: 1, order: 1 }, { unique: true });

// Satıcı puanı için indeksleme
reviewSchema.index({ vendor: 1, status: 1 });

// Kullanıcının değerlendirme geçmişi için indeksleme
reviewSchema.index({ user: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 