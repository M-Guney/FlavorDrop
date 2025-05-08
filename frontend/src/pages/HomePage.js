import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const storedUserInfo = localStorage.getItem('userInfo');
    
    if (storedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUserInfo(parsedUserInfo);
        
        // Kullanıcı tipine göre ilgili verileri yükle
        if (parsedUserInfo.role === 'vendor') {
          fetchVendorPendingOrders();
        } else {
          fetchVendors();
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi parse hatası:', error);
        fetchVendors(); // Hata durumunda default olarak restoranları getir
      }
    } else {
      fetchVendors(); // Kullanıcı giriş yapmamışsa restoranları getir
    }
  }, []);
  
  // Restoranları getir
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/vendors');
      
      if (response.data.success) {
        setVendors(response.data.data);
      }
    } catch (error) {
      console.error('Restoran verisi getirme hatası:', error);
      setError('Restoranlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Satıcının bekleyen siparişlerini getir
  const fetchVendorPendingOrders = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get('http://localhost:5000/api/orders/vendor', config);
      
      if (response.data.success) {
        // Sadece bekleyen ve hazırlanıyor durumundaki siparişleri filtrele
        const pendingOrders = response.data.data.filter(
          order => order.status === 'pending' || order.status === 'preparing'
        );
        setPendingOrders(pendingOrders);
      }
    } catch (error) {
      console.error('Sipariş verisi getirme hatası:', error);
      setError('Siparişler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Yükleme durumu
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p>Yükleniyor...</p>
      </Container>
    );
  }
  
  // Kullanıcı Anasayfası
  const renderUserHomePage = () => {
    return (
      <>
        <section className="hero-section py-5 bg-light mb-4">
          <Container>
            <Row className="align-items-center">
              <Col md={6}>
                <h1 className="display-4 mb-3">Sevdiğiniz Yemekler Kapınızda</h1>
                <p className="lead mb-4">
                  En sevdiğiniz restoranlardan lezzetli yemekleri sipariş edin ve kapınıza kadar getirtelim.
                </p>
                <Button 
                  variant="primary" 
                  size="lg" 
                  as={Link} 
                  to="/vendors"
                  className="px-4"
                >
                  Restoranlara Göz At
                </Button>
              </Col>
              <Col md={6} className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" 
                  alt="Lezzetli Yemekler" 
                  className="img-fluid rounded shadow-sm"
                />
              </Col>
            </Row>
          </Container>
        </section>
        
        <section className="featured-restaurants py-4">
          <Container>
            <h2 className="mb-4">Öne Çıkan Restoranlar</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            {vendors.length === 0 ? (
              <Alert variant="info">
                Henüz listelenecek restoran bulunmamaktadır.
              </Alert>
            ) : (
              <Row>
                {vendors.slice(0, 4).map((vendor) => (
                  <Col key={vendor._id} md={6} lg={3} className="mb-4">
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Img 
                        variant="top" 
                        src={vendor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.businessName)}&background=random&color=fff&size=250`} 
                        height="180"
                        style={{ objectFit: 'cover' }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title>{vendor.businessName}</Card.Title>
                        <Card.Text className="text-muted small">
                          {vendor.cuisine}
                        </Card.Text>
                        <Card.Text className="mb-4 small">
                          {vendor.description?.substring(0, 100)}
                          {vendor.description?.length > 100 ? '...' : ''}
                        </Card.Text>
                        <Button 
                          variant="outline-primary" 
                          as={Link} 
                          to={`/vendors/${vendor._id}`}
                          className="mt-auto"
                        >
                          Menüyü Gör
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            
            {vendors.length > 4 && (
              <div className="text-center mt-4">
                <Button 
                  variant="secondary" 
                  as={Link} 
                  to="/vendors"
                >
                  Tümünü Gör
                </Button>
              </div>
            )}
          </Container>
        </section>
      </>
    );
  };
  
  // Satıcı Anasayfası
  const renderVendorHomePage = () => {
    return (
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h2>Satıcı Kontrol Paneli</h2>
            <p className="text-muted">
              Hoş geldiniz, {userInfo?.name || userInfo?.email?.split('@')[0] || 'Satıcı'}!
              Satıcı panelinize buradan erişebilirsiniz.
            </p>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={6} lg={3} className="mb-3">
            <Card className="text-center h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="mb-3">
                  <i className="bi bi-list-check text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <Card.Title>Siparişler</Card.Title>
                <Card.Text>
                  Tüm siparişlerinizi görüntüleyin ve yönetin.
                </Card.Text>
                <Button 
                  variant="primary" 
                  as={Link} 
                  to="/vendor/orders"
                >
                  Siparişlere Git
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <Card className="text-center h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="mb-3">
                  <i className="bi bi-card-list text-success" style={{ fontSize: '2rem' }}></i>
                </div>
                <Card.Title>Menü</Card.Title>
                <Card.Text>
                  Menünüzü düzenleyin, yeni ürünler ekleyin veya çıkarın.
                </Card.Text>
                <Button 
                  variant="success" 
                  as={Link} 
                  to="/vendor/menu"
                >
                  Menüye Git
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <Card className="text-center h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="mb-3">
                  <i className="bi bi-calendar-check text-info" style={{ fontSize: '2rem' }}></i>
                </div>
                <Card.Title>Çalışma Saatleri</Card.Title>
                <Card.Text>
                  Çalışma saatlerinizi ve müsaitlik durumunuzu ayarlayın.
                </Card.Text>
                <Button 
                  variant="info" 
                  as={Link} 
                  to="/vendor/availability"
                >
                  Saatleri Ayarla
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <Card className="text-center h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="mb-3">
                  <i className="bi bi-person-circle text-secondary" style={{ fontSize: '2rem' }}></i>
                </div>
                <Card.Title>Profil</Card.Title>
                <Card.Text>
                  Restoran bilgilerinizi düzenleyin ve güncelleyin.
                </Card.Text>
                <Button 
                  variant="secondary" 
                  as={Link} 
                  to="/vendor/profile"
                >
                  Profili Düzenle
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Bekleyen Siparişler</h4>
              </Card.Header>
              <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                {pendingOrders.length === 0 ? (
                  <Alert variant="info">
                    Şu anda bekleyen sipariş bulunmamaktadır.
                  </Alert>
                ) : (
                  <div className="pending-orders">
                    {pendingOrders.map((order) => (
                      <div key={order._id} className="p-3 mb-3 border rounded bg-light">
                        <Row className="align-items-center">
                          <Col md={3}>
                            <p className="mb-1">
                              <strong>Sipariş No:</strong> #{order._id.substring(0, 8)}
                            </p>
                            <p className="mb-0 text-muted small">
                              {new Date(order.createdAt).toLocaleString('tr-TR')}
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="mb-1">
                              <strong>Müşteri:</strong> {order.userName}
                            </p>
                            <p className="mb-0 text-muted small">
                              {order.items.length} ürün
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="mb-1">
                              <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>
                                {order.status === 'pending' ? 'Beklemede' : 'Hazırlanıyor'}
                              </span>
                            </p>
                            <p className="mb-0 text-muted small">
                              <strong>Toplam:</strong> ₺{order.totalAmount.toFixed(2)}
                            </p>
                          </Col>
                          <Col md={3} className="text-md-end">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              as={Link} 
                              to={`/vendor/orders/${order._id}`}
                            >
                              Detaylar
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="bg-white">
                <Button 
                  variant="outline-primary" 
                  as={Link} 
                  to="/vendor/orders"
                >
                  Tüm Siparişleri Görüntüle
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  };
  
  return (
    <div className="home-page">
      {userInfo && userInfo.role === 'vendor' ? renderVendorHomePage() : renderUserHomePage()}
    </div>
  );
};

export default HomePage; 