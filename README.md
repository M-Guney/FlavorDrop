# Yemek Rezervasyon Uygulaması
Bu uygulama, kullanıcıların restoranlardan ve kişilerden yemek rezervasyonu yapabilecekleri ve restoran sahiplerinin işletmelerini yönetebilecekleri bir platformdur.

## Özellikler

- Kullanıcı kaydı ve girişi (Kullanıcı, Satıcı, Admin rolleri)
- JWT tabanlı yetkilendirme ve kimlik doğrulama
- Satıcı profil yönetimi
- Menü öğeleri ekleme, düzenleme, silme
- Restoran değerlendirme ve yorumlama sistemi
- Sipariş ve rezervasyon sistemi

## Teknolojiler

### Frontend
- React
- React Bootstrap (UI bileşenleri)
- React Router (sayfa yönlendirme)
- Axios (HTTP istekleri)
- LocalStorage (kullanıcı oturumu yönetimi)

### Backend
- Node.js
- Express.js (RESTful API)
- MongoDB (veritabanı)
- Mongoose (ODM)
- JWT (JSON Web Token - kimlik doğrulama)
- Bcrypt.js (şifre hashleme)

## Proje Mimarisi

### Backend Mimarisi

Backend, MVC (Model-View-Controller) mimarisine benzer bir yapıda düzenlenmiştir:

#### Modeller
- **User**: Kullanıcı hesap bilgileri (name, email, password, role)
- **VendorProfile**: Satıcı profil bilgileri (işletme adı, açıklama, adres, çalışma saatleri vb.)
- **MenuItem**: Menü öğeleri (isim, açıklama, fiyat, kategori, resim vb.)
- **Review**: Değerlendirmeler ve yorumlar
- **Order**: Siparişler ve detayları
- **Subscription**: Abonelik planları

#### Kontrolcüler
- **authController.js**: Kimlik doğrulama işlemleri (register, login, logout)
- **vendorController.js**: Satıcı profil yönetimi, menü öğesi işlemleri
- **reviewController.js**: Değerlendirme ve yorum işlemleri

#### Rotalar (Routes)
- **/api/auth**: Kimlik doğrulama rotaları (register, login, logout)
- **/api/vendors**: Satıcı profil yönetimi, menü öğeleri
- **/api/reviews**: Değerlendirme ve yorumlar

#### Middleware
- **auth.js**: Yetkilendirme ve kimlik doğrulama
- **asyncHandler.js**: Async/await hata yönetimi
- **errorResponse.js**: Standart hata yanıtları

### Frontend Mimarisi

Frontend, bileşen tabanlı bir yapıya sahiptir:

#### Sayfalar (Pages)
- **HomePage.js**: Ana sayfa ve uygulamanın giriş noktası
- **LoginPage.js**: Kullanıcı girişi
- **RegisterPage.js**: Kullanıcı kaydı

#### Bileşenler (Components)
- **Header.js**: Navigasyon çubuğu
- **Footer.js**: Sayfa altı bilgileri

#### Durum Yönetimi
- LocalStorage kullanarak kullanıcı oturumu ve token yönetimi

## API Endpointleri

### Kimlik Doğrulama İşlemleri
- `POST /api/auth/register`: Yeni kullanıcı oluşturma
- `POST /api/auth/login`: Kullanıcı girişi
- `GET /api/auth/me`: Mevcut kullanıcı bilgilerini getir
- `GET /api/auth/logout`: Çıkış yapma (istemci tarafında token temizlenir)

### Satıcı İşlemleri
- `POST /api/vendors/profile`: Satıcı profili oluştur/güncelle
- `GET /api/vendors/profile`: Kendi satıcı profilini görüntüle
- `PUT /api/vendors/profile/availability`: Satıcının müsait günlerini güncelle
- `GET /api/vendors/profile/availability`: Satıcının müsait günlerini görüntüle
- `GET /api/vendors`: Tüm satıcıları listele
- `GET /api/vendors/:id`: Satıcı detaylarını görüntüle

### Menü İşlemleri
- `POST /api/vendors/menu`: Menü öğesi ekle
- `PUT /api/vendors/menu/:id`: Menü öğesi güncelle
- `DELETE /api/vendors/menu/:id`: Menü öğesi sil
- `GET /api/vendors/:id/menu`: Satıcının menü öğelerini listele
- `GET /api/vendors/my-menu`: Satıcının kendi menüsünü görüntüle

### Değerlendirme İşlemleri
- `GET /api/reviews`: Tüm değerlendirmeleri listele
- `POST /api/reviews`: Yeni değerlendirme ekle
- `PUT /api/reviews/:id`: Değerlendirme güncelle
- `DELETE /api/reviews/:id`: Değerlendirme sil
- `POST /api/reviews/:id/reply`: Satıcı yanıtı ekle
- `POST /api/reviews/:id/like`: Değerlendirmeyi beğen
- `GET /api/reviews/stats/:targetType/:targetId`: Değerlendirme istatistikleri

## Kullanıcı Rolleri ve İzinler

### Kullanıcı (user)
- Satıcıları görüntüleme
- Menüleri inceleme
- Sipariş verme
- Değerlendirme ve yorum yapma

### Satıcı (vendor)
- Profil oluşturma ve güncelleme
- Menü öğeleri ekleme, güncelleme, silme
- Değerlendirmelere yanıt verme
- Siparişleri görüntüleme ve yönetme

### Admin (admin)
- Tüm kullanıcıları yönetme
- Tüm satıcıları onaylama/reddetme
- İçerikleri denetleme ve düzenleme

## Veri Modelleri

### VendorProfile
- İşletme adı, açıklama, logo
- Adres ve iletişim bilgileri
- Çalışma saatleri
- Kategoriler ve etiketler
- Değerlendirme puanı ve yorum sayısı

### MenuItem
- İsim, açıklama, fiyat
- Kategori ve resim
- Kullanılabilirlik durumu
- Besin değerleri ve alerjenler
- Hazırlama süresi ve indirim bilgileri

## Kurulum

### Gereksinimler
- Node.js
- MongoDB

### Backend Kurulumu
1. Backend klasörüne gidin:
```
cd food-booking-app/backend
```

2. Bağımlılıkları yükleyin:
```
npm install
```

3. .env dosyasını düzenleyin:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/food-booking
JWT_SECRET=guvenli_bir_jwt_anahtari123
```

4. Sunucuyu başlatın:
```
npm run dev
```

### Frontend Kurulumu
1. Frontend klasörüne gidin:
```
cd food-booking-app/frontend
```

2. Bağımlılıkları yükleyin:
```
npm install
```

3. React uygulamasını başlatın:
```
npm start
```

## API'yi Test Etme (Postman)

API'yi Postman ile test etmek için:

1. Kullanıcı Kaydı: `POST http://localhost:5000/api/auth/register`
   ```json
   {
     "name": "Test Kullanıcı",
     "email": "test@test.com",
     "password": "123456",
     "role": "user"
   }
   ```

2. Kullanıcı Girişi: `POST http://localhost:5000/api/auth/login`
   ```json
   {
     "email": "test@test.com",
     "password": "123456"
   }
   ```

3. Alınan token'ı diğer isteklerde Authorization header'ı olarak kullanın:
   ```
   Authorization: Bearer [token]
   ```

## Dosya Değişiklikleri

### Yeni Oluşturulan Dosyalar
- `middleware/auth.js`: Kimlik doğrulama middleware'i
- `middleware/asyncHandler.js`: Async işlemler için hata yakalama
- `utils/errorResponse.js`: Özel hata sınıfı
- `models/user.js`: Kullanıcı modeli
- `models/vendorProfile.js`: Satıcı profil modeli
- `models/menuItem.js`: Menü öğesi modeli
- `controllers/authController.js`: Kimlik doğrulama kontrolcüsü
- `controllers/vendorController.js`: Satıcı işlemleri kontrolcüsü
- `routes/authRoutes.js`: Kimlik doğrulama rotaları
- `routes/vendorRoutes.js`: Satıcı işlemleri rotaları

### Güncellenen Dosyalar
- `server.js`: Ana sunucu dosyası (User modeli kaldırıldı, modüler yapı eklendi)

## Lisans

MIT Lisansı 