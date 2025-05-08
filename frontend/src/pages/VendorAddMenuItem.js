import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorAddMenuItem = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Ana Yemekler',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    ingredients: '',
    allergens: '',
    image: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const navigate = useNavigate();
  
  // Kategori seçenekleri
  const categoryOptions = [
    'Başlangıçlar',
    'Ana Yemekler',
    'Tatlılar',
    'İçecekler',
    'Kahvaltı',
    'Sandviçler',
    'Salatalar',
    'Çorbalar',
    'Mezeler',
    'Fast Food',
    'Özel Menüler',
    'Diğer'
  ];
  
  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      console.log('Kullanıcı bilgisi bulunamadı, giriş sayfasına yönlendiriliyor');
      navigate('/login');
      return;
    }
    
    const userInfo = JSON.parse(storedUserInfo);
    console.log('Kullanıcı bilgileri:', userInfo);
    
    // Kullanıcı satıcı değilse ana sayfaya yönlendir
    if (userInfo.role !== 'vendor') {
      console.log('Kullanıcı satıcı değil, ana sayfaya yönlendiriliyor');
      navigate('/');
      return;
    }
    
    // Backend sağlık kontrolü
    const checkBackendHealth = async () => {
      try {
        console.log('Backend sağlık kontrolü yapılıyor...');
        await axios.get('http://localhost:5000/api/vendors');
        console.log('Backend aktif ve çalışıyor');
      } catch (error) {
        console.error('Backend bağlantı hatası:', error);
        setError('Sunucu ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.');
        return false;
      }
      return true;
    };
    
    // Satıcı profilinin olup olmadığını kontrol et
    const checkVendorProfile = async () => {
      const backendOk = await checkBackendHealth();
      if (!backendOk) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token bulunamadı');
          navigate('/login');
          return;
        }
        
        console.log('Satıcı profili kontrol ediliyor...');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get('http://localhost:5000/api/vendors/profile', config);
        console.log('Satıcı profili bulundu:', response.data);
      } catch (error) {
        console.error('Profil kontrolünde hata:', error.response || error);
        // Profil bulunamadı, profil oluşturma sayfasına yönlendir
        if (error.response && error.response.status === 404) {
          console.log('Satıcı profili bulunamadı, profil oluşturma sayfasına yönlendiriliyor');
          navigate('/vendor/profile/create');
        } else {
          setError('Bir hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
        }
      }
    };
    
    checkVendorProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Resim dosyası en fazla 5MB büyüklüğünde olabilir');
      return;
    }
    
    // Desteklenen formatlar
    const validFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setError('Lütfen JPEG, PNG veya WebP formatında bir resim yükleyin');
      return;
    }
    
    setUploadingImage(true);
    
    // Dosyayı Base64 formatına dönüştür
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData({
        ...formData,
        image: reader.result
      });
      setUploadingImage(false);
    };
    
    reader.onerror = () => {
      setError('Resim dosyası okunamadı, lütfen tekrar deneyin');
      setUploadingImage(false);
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Fiyatı doğru formata çevirme
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Lütfen geçerli bir fiyat girin');
      }
      
      // İçerik ve alerjenler dizilere dönüştürme
      const ingredients = formData.ingredients.split(',').map(item => item.trim()).filter(item => item);
      const allergens = formData.allergens.split(',').map(item => item.trim()).filter(item => item);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      
      console.log('Kullanılan token:', token);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Resmi kontrol et
      let imageData = formData.image;
      if (!imageData) {
        imageData = 'default-food.jpg'; // Default resim
      }
      
      const menuItemData = {
        ...formData,
        price,
        ingredients,
        allergens,
        spicyLevel: parseInt(formData.spicyLevel),
        image: imageData
      };
      
      console.log('Gönderilen menü verisi:', {
        ...menuItemData,
        image: menuItemData.image ? 'Base64 resim verisi (gizlendi)' : 'default-food.jpg'
      });
      
      const { data } = await axios.post(
        'http://localhost:5000/api/vendors/menu',
        menuItemData,
        config
      );
      
      console.log('API yanıtı:', data);
      
      if (data.success) {
        setSuccess(true);
        
        // 2 saniye sonra menü sayfasına yönlendir
        setTimeout(() => {
          navigate('/vendor/menu');
        }, 2000);
      }
    } catch (error) {
      console.error('Hata detayları:', error);
      
      if (error.response) {
        // Sunucu yanıtıyla dönen hata
        console.error('Sunucu yanıt hatası:', error.response.data);
        setError(error.response.data.message || 'Sunucu hatası: ' + error.response.status);
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı
        console.error('Yanıt alınamadı:', error.request);
        setError('Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.');
      } else {
        // İstek oluşturulurken hata
        console.error('İstek hatası:', error.message);
        setError(error.message || 'Bilinmeyen hata');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-md-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Yeni Menü Öğesi Ekle</h2>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/vendor/menu')}
                >
                  Geri Dön
                </Button>
              </div>
              
              {error && (
                <Alert 
                  variant="danger" 
                  className="p-3 mb-4"
                >
                  <strong>Hata:</strong> {error}
                </Alert>
              )}
              {success && (
                <Alert 
                  variant="success" 
                  className="p-3 mb-4"
                >
                  Menü öğesi başarıyla eklendi! Yönlendiriliyorsunuz...
                </Alert>
              )}
              {loading && (
                <Alert 
                  variant="info" 
                  className="p-3 mb-4"
                >
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    İşleminiz gerçekleştiriliyor...
                  </div>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Ürün Adı*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ürün adını girin"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="description">
                  <Form.Label>Açıklama*</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Ürün açıklamasını girin"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4" controlId="image">
                  <Form.Label>Ürün Resmi</Form.Label>
                  <div className="mb-3">
                    {imagePreview ? (
                      <div className="text-center mb-3">
                        <Image 
                          src={imagePreview} 
                          style={{ maxHeight: '200px', maxWidth: '100%' }} 
                          thumbnail 
                          fluid
                        />
                      </div>
                    ) : (
                      <div 
                        className="text-center p-4 mb-3 border rounded"
                        style={{ backgroundColor: '#f8f9fa' }}
                      >
                        <i className="bi bi-image fs-1 text-secondary"></i>
                        <p className="mt-2 text-muted">Resim önizlemesi burada görünecek</p>
                      </div>
                    )}
                    
                    <Form.Control
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageChange}
                    />
                    <Form.Text className="text-muted">
                      JPEG, PNG veya WebP formatında bir resim yükleyin (maks. 5MB)
                    </Form.Text>
                  </div>
                  
                  {uploadingImage && (
                    <div className="d-flex align-items-center mt-2">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                      </div>
                      <span>Resim işleniyor...</span>
                    </div>
                  )}
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="price">
                      <Form.Label>Fiyat (₺)*</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="category">
                      <Form.Label>Kategori*</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        {categoryOptions.map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="ingredients">
                  <Form.Label>İçindekiler (virgülle ayırın)</Form.Label>
                  <Form.Control
                    type="text"
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={handleChange}
                    placeholder="Örn: un, şeker, süt, yumurta"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="allergens">
                  <Form.Label>Alerjenler (virgülle ayırın)</Form.Label>
                  <Form.Control
                    type="text"
                    name="allergens"
                    value={formData.allergens}
                    onChange={handleChange}
                    placeholder="Örn: gluten, fındık, süt"
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="isAvailable">
                      <Form.Check
                        type="switch"
                        label="Aktif"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="spicyLevel">
                      <Form.Label>Acı Seviyesi (0-3)</Form.Label>
                      <Form.Select
                        name="spicyLevel"
                        value={formData.spicyLevel}
                        onChange={handleChange}
                      >
                        <option value="0">Acı Değil</option>
                        <option value="1">Az Acılı</option>
                        <option value="2">Orta Acılı</option>
                        <option value="3">Çok Acılı</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="isVegetarian">
                      <Form.Check
                        type="checkbox"
                        label="Vejetaryen"
                        name="isVegetarian"
                        checked={formData.isVegetarian}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="isVegan">
                      <Form.Check
                        type="checkbox"
                        label="Vegan"
                        name="isVegan"
                        checked={formData.isVegan}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="isGlutenFree">
                      <Form.Check
                        type="checkbox"
                        label="Glutensiz"
                        name="isGlutenFree"
                        checked={formData.isGlutenFree}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid gap-2 mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 mt-3"
                    disabled={loading || uploadingImage}
                  >
                    {loading ? 'Ekleniyor...' : 'Menü Öğesi Ekle'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendorAddMenuItem; 