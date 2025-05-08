import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Form, InputGroup, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorListPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const navigate = useNavigate();
  
  // Kategori seçenekleri
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
    // Debounce işlemi - her tuş vuruşundan sonra değil, küçük bir beklemeden sonra arama yapar
    const fetchVendors = async () => {
      try {
        setLoading(true);
        
        // Filtreleri oluştur
        let url = 'http://localhost:5000/api/vendors';
        let params = [];
        
        if (searchTerm) {
          params.push(`name=${searchTerm}`);
        }
        
        if (selectedCategory) {
          params.push(`category=${selectedCategory}`);
        }
        
        if (minRating) {
          params.push(`rating=${minRating}`);
        }
        
        if (menuSearchTerm) {
          params.push(`menuItem=${menuSearchTerm}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const { data } = await axios.get(url);
        
        if (data.success) {
          // Eğer menü araması yapılıyorsa, sadece eşleşen menü öğeleri olan restoranları göster
          if (menuSearchTerm && menuSearchTerm.trim() !== '') {
            const filteredVendors = data.data.filter(
              vendor => vendor.matchedMenuItems && vendor.matchedMenuItems.length > 0
            );
            setVendors(filteredVendors);
          } else {
            setVendors(data.data);
          }
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Restoranlar yüklenirken bir hata oluştu'
        );
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce mekanizması: klavye vuruşu 400ms durunca arama yap
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(
      setTimeout(() => {
        fetchVendors();
      }, 400)
    );
    
    // Component unmount olduğunda timeout'u temizle
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    
  }, [searchTerm, selectedCategory, minRating, menuSearchTerm]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Form gönderimi - Sayfa yenilenmesini engeller
  };
  
  const handleMenuSearch = (e) => {
    // Yazıldıkça doğrudan arama yapacak şekilde değeri güncelle
    setMenuSearchTerm(e.target.value);
  };
  
  const viewVendorDetails = (vendorId) => {
    navigate(`/vendor/${vendorId}`);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Restoranlar</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="mb-3">
              <Col md={5}>
                <Form.Group className="mb-3 mb-md-0">
                  <Form.Label>Restoran Adı</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Restoran ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" variant="primary">
                      Ara
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3 mb-md-0">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Minimum Puan</Form.Label>
                  <Form.Select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="">Tüm Puanlar</option>
                    <option value="4">4 ve üzeri ★</option>
                    <option value="3">3 ve üzeri ★</option>
                    <option value="2">2 ve üzeri ★</option>
                    <option value="1">1 ve üzeri ★</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Menü İçeriği Ara</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Yemek, tatlı, içecek vb. ara..."
                      value={menuSearchTerm}
                      onChange={handleMenuSearch}
                    />
                    {menuSearchTerm && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setMenuSearchTerm('')}
                      >
                        <i className="bi bi-x-lg"></i>
                      </Button>
                    )}
                    <Button variant="secondary" disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : <i className="bi bi-search"></i>}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Menü içeriğine göre arama yapmak için yazmaya başlayın. Örn: kebap, pizza, sütlü tatlı vb.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Restoranlar yükleniyor...</p>
        </div>
      ) : vendors.length === 0 ? (
        <Alert variant="info">
          {menuSearchTerm ? (
            <>Aramanızla eşleşen menü öğesi bulunamadı. Başka bir terim deneyin.</>
          ) : (
            <>Arama kriterlerinize uygun restoran bulunamadı.</>
          )}
        </Alert>
      ) : (
        <Row>
          {vendors.map((vendor) => (
            <Col key={vendor._id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm border-0 vendor-card" as={Link} to={`/vendors/${vendor._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card.Img 
                  variant="top" 
                  src={vendor.coverImage !== 'no-cover.jpg' ? vendor.coverImage : 'https://via.placeholder.com/300x150?text=Restoran'} 
                  alt={vendor.businessName}
                  style={{ height: '150px', objectFit: 'cover' }}
                />
                <Card.Body>
                  <Card.Title className="mb-1">{vendor.businessName}</Card.Title>
                  <div className="mb-2">
                    {[...Array(5)].map((_, index) => (
                      <i 
                        key={index}
                        className={`bi ${index < Math.round(vendor.rating) ? 'bi-star-fill' : 'bi-star'}`}
                        style={{ color: '#ffc107' }}
                      ></i>
                    ))}
                    <span className="ms-1 text-muted">({vendor.totalReviews || 0} değerlendirme)</span>
                  </div>
                  
                  <div className="mb-2">
                    {vendor.categories.slice(0, 3).map((category, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-1 border">
                        {category}
                      </Badge>
                    ))}
                    {vendor.categories.length > 3 && (
                      <Badge bg="light" text="dark">
                        +{vendor.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mb-2 text-muted small">
                    <i className="bi bi-geo-alt-fill me-1"></i>
                    {vendor.address.city}, {vendor.address.state}
                  </div>
                  
                  {/* Eşleşen menü öğelerini göster - minimal tasarım */}
                  {vendor.matchedMenuItems && vendor.matchedMenuItems.length > 0 && (
                    <div className="mt-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success me-1"></i>
                        <span className="text-success fw-bold">Aradığınız Menü Öğeleri ({vendor.matchedMenuItems.length})</span>
                      </div>
                      
                      <div className="menu-items-list mt-2">
                        {vendor.matchedMenuItems.map(item => (
                          <div 
                            key={item._id} 
                            className="d-flex justify-content-between align-items-center py-2 px-2 mt-1 menu-item"
                            style={{ 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '4px'
                            }}
                          >
                            <div className="d-flex align-items-center">
                              {menuSearchTerm ? (
                                <span dangerouslySetInnerHTML={{ 
                                  __html: item.name.replace(
                                    new RegExp(`(${menuSearchTerm})`, 'gi'), 
                                    '<strong style="color: #28a745;">$1</strong>'
                                  ) 
                                }} />
                              ) : (
                                item.name
                              )}
                              {item.isVegetarian && (
                                <span className="ms-1 text-success small">
                                  <i className="bi bi-flower1"></i>
                                </span>
                              )}
                            </div>
                            <div className="fw-bold">{item.price.toFixed(2)} ₺</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default VendorListPage; 