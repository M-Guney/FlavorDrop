const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'İsim alanı gereklidir']
  },
  email: {
    type: String,
    required: [true, 'Email alanı gereklidir'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir email adresi giriniz'
    ]
  },
  password: {
    type: String,
    required: [true, 'Şifre alanı gereklidir'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    match: [
      /^(\+90|0)?[0-9]{10}$/,
      'Lütfen geçerli bir telefon numarası giriniz'
    ]
  },
  address: {
    street: String,
    city: String,
    postalCode: String
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Şifreyi hashleme
UserSchema.pre('save', async function(next) {
  // Eğer şifre değiştirilmemişse hashlenmesin
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// JWT token oluşturma metodu
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Şifreleri karşılaştırma metodu
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 