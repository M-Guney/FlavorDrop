const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: [true, 'Rezervasyon tarihi zorunludur']
  },
  time: {
    type: String,
    required: [true, 'Rezervasyon saati zorunludur'],
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Geçerli bir saat formatı giriniz (HH:MM)'
    ]
  },
  note: {
    type: String,
    maxlength: [500, 'Not 500 karakterden uzun olamaz']
  },
  status: {
    type: String,
    enum: ['beklemede', 'onaylandı', 'reddedildi', 'iptal edildi', 'tamamlandı'],
    default: 'beklemede'
  },
  guestCount: {
    type: Number,
    default: 1,
    min: [1, 'Misafir sayısı en az 1 olmalıdır'],
    max: [20, 'Misafir sayısı en fazla 20 olabilir']
  },
  vendorName: {
    type: String
  },
  userName: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Her rezervasyon oluşturulduğunda kullanıcı ve satıcı adlarını otomatik kaydet
ReservationSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }
  
  try {
    // Satıcı adını getir ve kaydet
    const VendorProfile = mongoose.model('VendorProfile');
    const User = mongoose.model('User');
    
    const vendor = await VendorProfile.findById(this.vendor);
    if (vendor) {
      this.vendorName = vendor.businessName;
    }
    
    // Kullanıcı adını getir ve kaydet
    const user = await User.findById(this.user);
    if (user) {
      this.userName = user.name;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Reservation', ReservationSchema); 