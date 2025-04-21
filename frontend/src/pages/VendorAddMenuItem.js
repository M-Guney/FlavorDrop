import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorAddMenuItem = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Ana Yemek',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    ingredients: '',
    allergens: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  // Kategori seçenekleri
  const categoryOptions = [
    'Ana Yemek',
    'Çorba',
    'Salata',
    'Tatlı',
    'İçecek',
    'Aperatif',
    'Kahvaltı',
    'Özel Menü'
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
    
    // Satıcı profilinin olup olmadığını kontrol et
    const checkVendorProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        await axios.get('http://localhost:5000/api/vendors/profile', config);
      } catch (error) {
        // Profil bulunamadı, profil oluşturma sayfasına yönlendir
        if (error.response && error.response.status === 404) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Fiyatı doğru formata çevirme
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Lütfen geçerli bir fiyat girin');
      return;
    }
    
    // İçerik ve alerjenler dizilere dönüştürme
    const ingredients = formData.ingredients.split(',').map(item => item.trim()).filter(item => item);
    const allergens = formData.allergens.split(',').map(item => item.trim()).filter(item => item);
    
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
      
      const menuItemData = {
        ...formData,
        price,
        ingredients,
        allergens,
        spicyLevel: parseInt(formData.spicyLevel)
      };
      
      const { data } = await axios.post(
        'http://localhost:5000/api/vendors/menu',
        menuItemData,
        config
      );
      
      if (data.success) {
        setSuccess(true);
        
        // 2 saniye sonra menü sayfasına yönlendir
        setTimeout(() => {
          navigate('/vendor/menu');
        }, 2000);
      }
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Menü öğesi eklenirken bir hata oluştu'
      );
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
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">Menü öğesi başarıyla eklendi! Yönlendiriliyorsunuz...</Alert>}
              
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
                    variant="success" 
                    type="submit"
                    disabled={loading || success}
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