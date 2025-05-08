import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorProfileCreate = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Türkiye'
    },
    phoneNumber: '',
    categories: ['Türk Mutfağı'],
    cuisine: 'Türk Mutfağı'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const navigate = useNavigate();
  
  // Kategoriler listesi
  const categoryOptions = [
    'Türk Mutfağı',
    'Dünya Mutfağı',
    'Fast Food',
    'Deniz Ürünleri',
    'Vejetaryen',
    'Vegan',
    'Tatlılar',
    'İçecekler',
    'Kahvaltı',
    'Öğle Yemeği',
    'Akşam Yemeği',
    'Sokak Lezzetleri',
    'Pasta ve Börek',
    'Diğer'
  ];

  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      navigate('/login');
      return;
    }
    
    const userInfo = JSON.parse(storedUserInfo);
    setUserInfo(userInfo);
    
    // Satıcı profilinin olup olmadığını kontrol et
    const checkVendorProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        console.log('Token kontrolü:', token);
        
        const { data } = await axios.get('http://localhost:5000/api/vendors/profile', config);
        
        // Eğer profil varsa, düzenleme sayfasına yönlendir
        if (data.success) {
          navigate('/vendor/profile/edit');
        }
      } catch (error) {
        // Profil bulunamadı, bu sayfada kalabilir
        if (error.response && error.response.status !== 404) {
          setError('Bir hata oluştu: ' + error.response.data.message);
        }
        
        // 401 hatası - yetkilendirme sorunu
        if (error.response && error.response.status === 401) {
          console.error('Yetkilendirme hatası:', error);
          setError('Oturum süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    };
    
    checkVendorProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setFormData({
        ...formData,
        categories: [...formData.categories, value]
      });
    } else {
      setFormData({
        ...formData,
        categories: formData.categories.filter(cat => cat !== value)
      });
    }
  };
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (1MB = 1048576 bytes)
      const fileSize = file.size;
      const maxSize = 1048576; // 1MB
      
      if (fileSize > maxSize) {
        setError(`Logo dosyası çok büyük! Maksimum 1MB olmalıdır. Şu anki boyut: ${(fileSize / 1048576).toFixed(2)}MB`);
        e.target.value = ''; // Input'u temizle
        return;
      }
      
      // Dosya tipi kontrolü
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError(`Geçersiz dosya formatı! Kabul edilen formatlar: JPEG, PNG, JPG, GIF`);
        e.target.value = ''; // Input'u temizle
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Hata mesajını temizle
      if (error) setError('');
    }
  };
  
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (2MB = 2097152 bytes)
      const fileSize = file.size;
      const maxSize = 2097152; // 2MB
      
      if (fileSize > maxSize) {
        setError(`Kapak resmi dosyası çok büyük! Maksimum 2MB olmalıdır. Şu anki boyut: ${(fileSize / 1048576).toFixed(2)}MB`);
        e.target.value = ''; // Input'u temizle
        return;
      }
      
      // Dosya tipi kontrolü
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError(`Geçersiz dosya formatı! Kabul edilen formatlar: JPEG, PNG, JPG, GIF`);
        e.target.value = ''; // Input'u temizle
        return;
      }
      
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Hata mesajını temizle
      if (error) setError('');
    }
  };
  
  // Resim yükleme fonksiyonu
  const uploadImage = async (file, type) => {
    try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type); // 'logo' veya 'cover'
    
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Kimlik doğrulama jetonu bulunamadı');
      }
      
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
      }
    };
    
      console.log(`${type} resmi yükleniyor...`);
      console.log('Kullanılan token:', token);
      
      // Doğru endpoint ve hata ayıklama mesajları
      console.log('Resim yükleme isteği gönderiliyor:', {
        url: 'http://localhost:5000/api/vendors/upload',
        type,
        fileSize: Math.round(file.size / 1024) + 'KB',
        fileName: file.name
      });
      
      const response = await axios.post(
      'http://localhost:5000/api/vendors/upload',
      formData,
      config
    );
    
      console.log('Sunucu yanıtı:', response);
      
      if (response.data && response.data.success) {
        console.log(`${type} resmi başarıyla yüklendi:`, response.data);
        return response.data.imageUrl;
      } else {
        throw new Error(response.data?.message || `${type} resmi yüklenemedi`);
      }
    } catch (error) {
      console.error(`${type} resmi yükleme hatası:`, error);
      
      if (error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // 401 hatasını özel olarak işle
        if (error.response.status === 401) {
          throw new Error('Yetkilendirme hatası: Oturum süresi dolmuş veya geçersiz');
        }
        
        // 400 hatasını özel olarak işle
        if (error.response.status === 400) {
          throw new Error(`400 Bad Request: ${error.response.data?.message || 'Dosya formatı veya boyutu uygun olmayabilir'}`);
        }
      }
      
      throw new Error(`${type} resmi yüklenirken hata: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basit doğrulama
    if (!formData.businessName || !formData.description || !formData.phoneNumber) {
      setError('Lütfen tüm gerekli alanları doldurun');
      return;
    }
    
    if (formData.categories.length === 0) {
      setError('En az bir kategori seçmelisiniz');
      return;
    }
    
    if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zipCode) {
      setError('Lütfen tüm adres alanlarını doldurun');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Önce resimleri yükle
      let vendorData = { ...formData };
      
      if (logoFile || coverFile) {
        setUploadingImages(true);
        try {
          // Logo yükleme
          if (logoFile) {
            try {
            const logoUrl = await uploadImage(logoFile, 'logo');
            vendorData.logo = logoUrl;
            } catch (logoError) {
              console.error('Logo yükleme hatası:', logoError);
              setError('Logo resmi yüklenirken bir hata oluştu: ' + logoError.message);
              setLoading(false);
              setUploadingImages(false);
              return;
            }
          }
          
          // Kapak resmi yükleme
          if (coverFile) {
            try {
            const coverUrl = await uploadImage(coverFile, 'cover');
            vendorData.coverImage = coverUrl;
            } catch (coverError) {
              console.error('Kapak resmi yükleme hatası:', coverError);
              setError('Kapak resmi yüklenirken bir hata oluştu: ' + coverError.message);
              setLoading(false);
              setUploadingImages(false);
              return;
            }
          }
        } catch (error) {
          console.error('Genel resim yükleme hatası:', error);
          setError('Resimler yüklenirken bir hata oluştu: ' + error.message);
          setLoading(false);
          setUploadingImages(false);
          return;
        }
        setUploadingImages(false);
      }
      
      const token = localStorage.getItem('token'); // 'userToken' yerine 'token' kullanılmalı
      
      if (!token) {
        setError('Kimlik doğrulama jetonu bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log('Satıcı profili oluşturuluyor:', vendorData);
      
      const response = await axios.post(
        'http://localhost:5000/api/vendors/profile',
        vendorData,
        config
      );
      
      if (response.data && response.data.success) {
        setSuccess(true);
        
        // localStorage'daki kullanıcı bilgilerini güncelle
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
          userInfo.vendorProfile = response.data.data;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          window.dispatchEvent(new Event('storage'));
        }
        
        // 2 saniye sonra satıcı paneline yönlendir
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 2000);
      } else {
        setError(response.data?.message || 'Satıcı profili oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('Satıcı profili oluşturma hatası:', error);
      setError(error.response?.data?.message || 'Bilinmeyen bir hata oluştu');
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
              <h2 className="text-center mb-4">İşletme Profili Oluştur</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">Profil başarıyla oluşturuldu! Yönlendiriliyorsunuz...</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <h5 className="mt-4 mb-3">Görsel Bilgileri</h5>
                
                <Row className="mb-4">
                  <Col md={6} className="mb-3 mb-md-0">
                    <Form.Group controlId="logoFile">
                      <Form.Label>İşletme Logosu</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <Form.Text className="text-muted">
                        Önerilen boyut: 300x300 piksel. Maks 1MB.
                      </Form.Text>
                      {logoPreview && (
                        <div className="mt-2 text-center">
                          <Image 
                            src={logoPreview} 
                            alt="Logo Önizleme" 
                            style={{ maxWidth: '200px', maxHeight: '200px' }} 
                            thumbnail 
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group controlId="coverFile">
                      <Form.Label>Kapak Resmi</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                      />
                      <Form.Text className="text-muted">
                        Önerilen boyut: 1200x300 piksel. Maks 2MB.
                      </Form.Text>
                      {coverPreview && (
                        <div className="mt-2 text-center">
                          <Image 
                            src={coverPreview} 
                            alt="Kapak Resmi Önizleme" 
                            style={{ maxWidth: '100%', maxHeight: '150px' }} 
                            thumbnail 
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                
                <h5 className="mt-4 mb-3">İşletme Bilgileri</h5>
                
                <Form.Group className="mb-3" controlId="businessName">
                  <Form.Label>İşletme Adı*</Form.Label>
                  <Form.Control
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="İşletme adınızı girin"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="description">
                  <Form.Label>İşletme Açıklaması*</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="İşletmeniz hakkında kısa bir açıklama yazın"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="phoneNumber">
                  <Form.Label>Telefon Numarası*</Form.Label>
                  <Form.Control
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Telefon numaranızı girin (ör. 0555 123 4567)"
                    required
                  />
                </Form.Group>
                
                <h5 className="mt-4 mb-3">Adres Bilgileri</h5>
                
                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Group controlId="address.street">
                      <Form.Label>Sokak/Cadde*</Form.Label>
                      <Form.Control
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleChange}
                        placeholder="Sokak/Cadde adı, bina no, daire no"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="address.city">
                      <Form.Label>Şehir*</Form.Label>
                      <Form.Control
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        placeholder="Şehir"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="address.state">
                      <Form.Label>İlçe*</Form.Label>
                      <Form.Control
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        placeholder="İlçe"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="address.zipCode">
                      <Form.Label>Posta Kodu*</Form.Label>
                      <Form.Control
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        placeholder="Posta kodu"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="address.country">
                      <Form.Label>Ülke</Form.Label>
                      <Form.Control
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleChange}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <h5 className="mt-4 mb-3">Mutfak Bilgileri</h5>
                
                <Form.Group className="mb-3" controlId="cuisine">
                  <Form.Label>Ana Mutfak Türü*</Form.Label>
                  <Form.Select
                    name="cuisine"
                    value={formData.cuisine}
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
                
                <Form.Group className="mb-4" controlId="categories">
                  <Form.Label>Kategoriler (En az bir kategori seçin)*</Form.Label>
                  <div className="d-flex flex-wrap">
                    {categoryOptions.map((category, index) => (
                      <Form.Check
                        key={index}
                        type="checkbox"
                        id={`category-${index}`}
                        label={category}
                        value={category}
                        checked={formData.categories.includes(category)}
                        onChange={handleCategoryChange}
                        className="me-3 mb-2"
                      />
                    ))}
                  </div>
                </Form.Group>
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading || success || uploadingImages}
                  >
                    {loading ? 'Kaydediliyor...' : uploadingImages ? 'Resimler Yükleniyor...' : 'Profil Oluştur'}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/vendor/dashboard')}
                    disabled={loading || success || uploadingImages}
                  >
                    İptal
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

export default VendorProfileCreate; 