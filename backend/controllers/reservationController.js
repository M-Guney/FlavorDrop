const Reservation = require('../models/reservation');
const VendorProfile = require('../models/vendorProfile');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Yeni rezervasyon oluştur
// @route   POST /api/reservations
// @access  Private (Kullanıcılar)
exports.createReservation = asyncHandler(async (req, res, next) => {
  const { vendor, date, time, note, guestCount } = req.body;
  
  // Satıcının müsaitlik durumunu kontrol et
  const vendorProfile = await VendorProfile.findById(vendor);
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Belirtilen satıcı bulunamadı', 404)
    );
  }
  
  // Tarih nesnesi oluştur
  const reservationDate = new Date(date);
  const dayOfWeek = reservationDate.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
  
  // Gün adını bul
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dayName = dayNames[dayOfWeek];
  
  // Satıcının o gün için müsaitlik ayarlarını bul
  const dayAvailability = vendorProfile.availability.find(
    day => day.day === dayName
  );
  
  if (!dayAvailability) {
    return next(
      new ErrorResponse(`Satıcının ${dayName} günü için müsaitlik bilgisi bulunamadı`, 400)
    );
  }
  
  if (!dayAvailability.isOpen) {
    return next(
      new ErrorResponse(`Satıcı ${dayName} günü kapalıdır`, 400)
    );
  }
  
  // Seçilen saatin çalışma saatleri içinde olup olmadığını kontrol et
  const [selectedHour, selectedMinute] = time.split(':').map(Number);
  const [openHour, openMinute] = dayAvailability.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = dayAvailability.closeTime.split(':').map(Number);
  
  // Seçilen saat açılış saatinden önce mi?
  if (
    selectedHour < openHour || 
    (selectedHour === openHour && selectedMinute < openMinute)
  ) {
    return next(
      new ErrorResponse(`Seçilen saat (${time}), açılış saatinden (${dayAvailability.openTime}) önce`, 400)
    );
  }
  
  // Seçilen saat kapanış saatinden sonra mı?
  if (
    selectedHour > closeHour || 
    (selectedHour === closeHour && selectedMinute > closeMinute)
  ) {
    return next(
      new ErrorResponse(`Seçilen saat (${time}), kapanış saatinden (${dayAvailability.closeTime}) sonra`, 400)
    );
  }
  
  // Seçilen saat ve tarih için mevcut rezervasyon sayısını kontrol et
  const existingReservationsCount = await Reservation.countDocuments({
    vendor,
    date: { $eq: reservationDate },
    time,
    status: { $nin: ['iptal edildi', 'reddedildi'] }
  });
  
  if (existingReservationsCount >= dayAvailability.maxOrdersPerSlot) {
    return next(
      new ErrorResponse(`Seçilen saat için tüm slotlar dolu, lütfen başka bir saat seçin`, 400)
    );
  }
  
  // Yeni rezervasyon oluştur
  const reservation = await Reservation.create({
    user: req.user.id,
    vendor,
    date: reservationDate,
    time,
    note,
    guestCount: guestCount || 1,
    status: 'beklemede'
  });

  res.status(201).json({
    success: true,
    data: reservation
  });
});

// @desc    Kullanıcının kendi rezervasyonlarını listele
// @route   GET /api/reservations
// @access  Private (Kullanıcılar)
exports.getMyReservations = asyncHandler(async (req, res, next) => {
  const reservations = await Reservation.find({ user: req.user.id })
    .sort({ date: 1, time: 1 });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc    Rezervasyon detayı getir
// @route   GET /api/reservations/:id
// @access  Private (Kullanıcılar + İlgili satıcı)
exports.getReservationById = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li rezervasyon bulunamadı`, 404)
    );
  }
  
  // Sadece kendi rezervasyonlarını görebilir
  if (reservation.user.toString() !== req.user.id) {
    // Satıcı ise ve rezervasyon kendi restoranı için ise görebilir
    const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
    
    if (!vendorProfile || vendorProfile._id.toString() !== reservation.vendor.toString()) {
      return next(
        new ErrorResponse('Bu rezervasyonu görüntüleme yetkiniz yok', 403)
      );
    }
  }
  
  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc    Rezervasyon durumunu güncelle
// @route   PUT /api/reservations/:id/status
// @access  Private (Sadece ilgili satıcı)
exports.updateReservationStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  // Geçerli durum kontrolü
  if (!['beklemede', 'onaylandı', 'reddedildi', 'iptal edildi', 'tamamlandı'].includes(status)) {
    return next(
      new ErrorResponse('Geçersiz rezervasyon durumu', 400)
    );
  }
  
  let reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li rezervasyon bulunamadı`, 404)
    );
  }
  
  // Yetki kontrolü - Sadece ilgili satıcı rezervasyon durumunu güncelleyebilir
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (!vendorProfile || vendorProfile._id.toString() !== reservation.vendor.toString()) {
    return next(
      new ErrorResponse('Bu rezervasyonu güncelleme yetkiniz yok', 403)
    );
  }
  
  // Rezervasyon durumunu güncelle
  reservation.status = status;
  await reservation.save();
  
  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc    Satıcının kendi restoranına ait rezervasyonları listele
// @route   GET /api/vendors/reservations
// @access  Private (Sadece satıcılar)
exports.getVendorReservations = asyncHandler(async (req, res, next) => {
  // Satıcı profilini bul
  const vendorProfile = await VendorProfile.findOne({ user: req.user.id });
  
  if (!vendorProfile) {
    return next(
      new ErrorResponse('Satıcı profili bulunamadı', 404)
    );
  }
  
  // Tarih filtresi için
  const { date, status } = req.query;
  const filter = { vendor: vendorProfile._id };
  
  if (date) {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    filter.date = {
      $gte: selectedDate,
      $lt: nextDay
    };
  }
  
  if (status) {
    filter.status = status;
  }
  
  // Rezervasyonları getir
  const reservations = await Reservation.find(filter)
    .sort({ date: 1, time: 1 });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc    Kullanıcı kendi rezervasyonunu iptal eder
// @route   PUT /api/reservations/:id/cancel
// @access  Private (Sadece ilgili kullanıcı)
exports.cancelReservation = asyncHandler(async (req, res, next) => {
  let reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li rezervasyon bulunamadı`, 404)
    );
  }
  
  // Yetki kontrolü - Sadece kendi rezervasyonunu iptal edebilir
  if (reservation.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Bu rezervasyonu iptal etme yetkiniz yok', 403)
    );
  }
  
  // Sadece beklemede veya onaylanmış rezervasyonlar iptal edilebilir
  if (!['beklemede', 'onaylandı'].includes(reservation.status)) {
    return next(
      new ErrorResponse(`${reservation.status} durumundaki rezervasyon iptal edilemez`, 400)
    );
  }
  
  // Rezervasyon durumunu güncelle
  reservation.status = 'iptal edildi';
  await reservation.save();
  
  res.status(200).json({
    success: true,
    data: reservation
  });
}); 