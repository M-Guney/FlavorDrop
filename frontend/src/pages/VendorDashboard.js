import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Nav, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // localStorage'dan kullanıcı bilgilerini al
      const storedUserInfo = localStorage.getItem('userInfo');
      if (!storedUserInfo) {
        navigate('/login');
        return;
      }
      
      const userInfo = JSON.parse(storedUserInfo);
      setUserInfo(userInfo);
      
      // Kullanıcı satıcı değilse ana sayfaya yönlendir
      if (userInfo.role !== 'vendor') {
        navigate('/');
        return;
      }
      
      try {
        // Satıcı profili bilgilerini getir
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        };
        
        const { data } = await axios.get('http://localhost:5000/api/vendors/profile', config);
        setVendorProfile(data.data);
      } catch (error) {
        setError('Satıcı profili yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          Yükleniyor...
        </Alert>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Satıcı Kontrol Paneli</h2>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>{vendorProfile?.businessName || 'İşletme Profili'}</Card.Title>
              <hr />
              <p><strong>Ad Soyad:</strong> {userInfo.name}</p>
              <p><strong>E-posta:</strong> {userInfo.email}</p>
              {vendorProfile && (
                <>
                  <p><strong>Telefon:</strong> {vendorProfile.phoneNumber}</p>
                  <p><strong>Kategoriler:</strong> {vendorProfile.categories.join(', ')}</p>
                </>
              )}
              <div className="mt-3">
                {!vendorProfile ? (
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/vendor/profile/create')}
                    className="w-100"
                  >
                    Profil Oluştur
                  </Button>
                ) : (
                  <Button 
                    variant="outline-primary"
                    onClick={() => navigate('/vendor/profile/edit')}
                    className="w-100"
                  >
                    Profil Düzenle
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Tab.Container id="vendor-dashboard-tabs" defaultActiveKey="menu">
                <Nav variant="tabs" className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="menu">Menü Yönetimi</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="availability">Müsaitlik Ayarları</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="orders">Siparişler</Nav.Link>
                  </Nav.Item>
                </Nav>
                
                <Tab.Content>
                  <Tab.Pane eventKey="menu">
                    <div className="text-end mb-3">
                      <Button 
                        variant="success"
                        onClick={() => navigate('/vendor/menu/add')}
                        disabled={!vendorProfile}
                      >
                        Yeni Menü Öğesi Ekle
                      </Button>
                    </div>
                    
                    {!vendorProfile ? (
                      <Alert variant="warning">
                        Menü öğesi eklemek için önce işletme profili oluşturmalısınız.
                      </Alert>
                    ) : (
                      <div className="text-center">
                        <Button 
                          variant="outline-primary"
                          onClick={() => navigate('/vendor/menu')}
                        >
                          Menü Yönetimine Git
                        </Button>
                      </div>
                    )}
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="availability">
                    {!vendorProfile ? (
                      <Alert variant="warning">
                        Müsaitlik ayarlarını düzenlemek için önce işletme profili oluşturmalısınız.
                      </Alert>
                    ) : (
                      <div className="text-center">
                        <Button 
                          variant="outline-primary"
                          onClick={() => navigate('/vendor/availability')}
                        >
                          Müsaitlik Ayarlarına Git
                        </Button>
                      </div>
                    )}
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="orders">
                    <Alert variant="info">
                      Sipariş yönetimi yakında eklenecektir.
                    </Alert>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendorDashboard; 