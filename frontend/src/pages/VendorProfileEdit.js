import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorProfileEdit = () => {
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
    categories: [],
    cuisine: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
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
    
    // Kullanıcı satıcı değilse ana sayfaya yönlendir
    if (userInfo.role !== 'vendor') {
      navigate('/');
      return;
    }
    
    // Satıcı profilini getir
    const fetchVendorProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const { data } = await axios.get('http://localhost:5000/api/vendors/profile', config);
        
        if (data.success) {
          const profile = data.data;
          setFormData({
            businessName: profile.businessName || '',
            description: profile.description || '',
            address: {
              street: profile.address?.street || '',
              city: profile.address?.city || '',
              state: profile.address?.state || '',
              zipCode: profile.address?.zipCode || '',
              country: profile.address?.country || 'Türkiye'
            },
            phoneNumber: profile.phoneNumber || '',
            categories: profile.categories || [],
            cuisine: profile.cuisine || 'Türk Mutfağı'
          });
        } else {
          // Profil bulunamadı, profil oluşturma sayfasına yönlendir
          navigate('/vendor/profile/create');
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          navigate('/vendor/profile/create');
        } else {
          setError('Profil bilgileri yüklenirken bir hata oluştu');
        }
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchVendorProfile();
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
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const { data } = await axios.post(
        'http://localhost:5000/api/vendors/profile',
        formData,
        config
      );
      
      if (data.success) {
        setSuccess(true);
        
        // 2 saniye sonra satıcı paneline yönlendir
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 2000);
      }
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Profil güncellenirken bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          Yükleniyor...
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-md-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">İşletme Profili Düzenle</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">Profil başarıyla güncellendi! Yönlendiriliyorsunuz...</Alert>}
              
              <Form onSubmit={handleSubmit}>
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
                    disabled={loading || success}
                  >
                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/vendor/dashboard')}
                    disabled={loading || success}
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

export default VendorProfileEdit; 