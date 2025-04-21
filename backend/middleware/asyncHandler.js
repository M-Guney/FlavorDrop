// Async fonksiyonlar için try-catch sarmalayıcı
// Bu middleware, tüm controller fonksiyonlarında try-catch bloğu yazmak yerine
// tek bir yerden hata yönetimi sağlar
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 