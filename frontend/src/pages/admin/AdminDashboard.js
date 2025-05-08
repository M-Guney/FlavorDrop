import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaUsers, FaStore, FaClipboardList, FaSignInAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    userCount: 0,
    vendorCount: 0,
    orderCount: 0,
    pendingOrderCount: 0,
    systemStatus: 'loading',
    lastCheck: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Admin yetki kontrolü
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const checkAdminAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/check-admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.isAdmin) {
          navigate('/');
        } else {
          fetchStats();
        }
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        setError('Admin kontrolü yapılırken bir hata oluştu.');
        navigate('/login');
      }
    };
    
    checkAdminAuth();
  }, [navigate]);
  
  // İstatistikleri getir
  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(response.data.data);
    } catch (error) {
      console.error('İstatistikler alınamadı:', error);
      setError('İstatistikler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Kontrol Paneli</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-3">
                <FaUsers />
              </div>
              <h2 className="display-6">{stats.userCount}</h2>
              <Card.Title>Kullanıcılar</Card.Title>
              <Button 
                as={Link} 
                to="/admin/users" 
                variant="outline-primary" 
                className="mt-3"
              >
                Detaylar
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-3">
                <FaStore />
              </div>
              <h2 className="display-6">{stats.vendorCount}</h2>
              <Card.Title>Restoranlar</Card.Title>
              <Button 
                as={Link} 
                to="/admin/vendors" 
                variant="outline-success" 
                className="mt-3"
              >
                Detaylar
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-info mb-3">
                <FaClipboardList />
              </div>
              <h2 className="display-6">{stats.orderCount}</h2>
              <Card.Title>Toplam Sipariş</Card.Title>
              <Button 
                as={Link} 
                to="/admin/orders" 
                variant="outline-info" 
                className="mt-3"
              >
                Detaylar
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-warning mb-3">
                <FaSignInAlt />
              </div>
              <h2 className="display-6">{stats.pendingOrderCount}</h2>
              <Card.Title>Bekleyen Siparişler</Card.Title>
              <Button 
                as={Link} 
                to="/admin/orders" 
                variant="outline-warning" 
                className="mt-3"
              >
                Detaylar
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              Hızlı Erişim
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col xs={6}>
                  <Button 
                    as={Link} 
                    to="/admin/users/add" 
                    variant="outline-primary" 
                    className="w-100"
                  >
                    <FaUsers className="me-2" /> Kullanıcı Ekle
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button 
                    as={Link} 
                    to="/admin/vendors/add" 
                    variant="outline-success" 
                    className="w-100"
                  >
                    <FaStore className="me-2" /> Restoran Ekle
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => navigate('/admin/orders')}
                  >
                    <FaClipboardList className="me-2" /> Raporlar
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="outline-info"
                    className="w-100"
                    onClick={() => navigate('/admin/settings')}
                  >
                    Sistem Ayarları
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              Sistem Bilgisi
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h5>Sistem Durumu</h5>
                <p className="mb-0">
                  {stats.systemStatus === 'active' ? (
                    <span className="text-success">Tüm sistemler çalışıyor</span>
                  ) : (
                    <span className="text-danger">Sistem hatası</span>
                  )}
                </p>
              </div>
              
              <div>
                <h5>Son Kontrol</h5>
                <p className="mb-0">
                  {stats.lastCheck ? new Date(stats.lastCheck).toLocaleString('tr-TR') : 'Bilinmiyor'}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 