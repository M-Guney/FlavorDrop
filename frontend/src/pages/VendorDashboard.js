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
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Yönetim Seçenekleri</h4>
                {vendorProfile && (
                  <Button 
                    variant="success"
                    onClick={() => navigate('/vendor/menu/add')}
                  >
                    Yeni Menü Öğesi Ekle
                  </Button>
                )}
              </div>
              
              {!vendorProfile ? (
                <Alert variant="warning">
                  Menü ve müsaitlik ayarları için önce işletme profili oluşturmalısınız.
                </Alert>
              ) : (
                <Row className="g-3">
                  <Col md={4}>
                    <Card className="h-100 text-center">
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <i className="bi bi-list-ul fs-1 text-primary mb-3"></i>
                          <h5>Menü Yönetimi</h5>
                          <p className="text-muted">Menülerinizi düzenleyin, yeni öğeler ekleyin</p>
                        </div>
                        <Button 
                          variant="outline-primary"
                          onClick={() => navigate('/vendor/menu')}
                          className="w-100"
                        >
                          Menü Yönetimine Git
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={4}>
                    <Card className="h-100 text-center">
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <i className="bi bi-calendar-check fs-1 text-success mb-3"></i>
                          <h5>Müsaitlik Ayarları</h5>
                          <p className="text-muted">Çalışma saatlerinizi ve rezervasyon ayarlarını düzenleyin</p>
                        </div>
                        <Button 
                          variant="outline-success"
                          onClick={() => navigate('/vendor/availability')}
                          className="w-100"
                        >
                          Müsaitlik Ayarlarına Git
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={4}>
                    <Card className="h-100 text-center">
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <i className="bi bi-clipboard-check fs-1 text-warning mb-3"></i>
                          <h5>Siparişler</h5>
                          <p className="text-muted">Rezervasyon isteklerini ve siparişleri görüntüleyin</p>
                        </div>
                        <Button 
                          variant="outline-warning"
                          disabled
                          className="w-100"
                        >
                          Yakında Eklenecek
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendorDashboard; 