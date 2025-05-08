import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup, Tab, Nav, Table } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
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
          fetchUserDetails();
        }
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        setError('Admin yetkiniz doğrulanamadı.');
        navigate('/login');
      }
    };
    
    checkAdminAuth();
  }, [id, navigate]);
  
  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserData(response.data.data);
    } catch (error) {
      console.error('Kullanıcı detayları alınamadı:', error);
      setError('Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/users/admin/users/${id}/toggle-status`,
        { isActive: !userData.user.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Kullanıcı detaylarını yeniden yükle
      fetchUserDetails();
    } catch (error) {
      console.error('Kullanıcı durumu güncellenemedi:', error);
      setError('Kullanıcı durumu güncellenirken bir hata oluştu.');
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
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
  
  if (!userData || !userData.user) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Kullanıcı bilgileri bulunamadı.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/admin/users')}>
          Kullanıcı Listesine Dön
        </Button>
      </Container>
    );
  }
  
  const { user, orders, vendorProfile } = userData;
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Kullanıcı Detayları</h2>
        <Button variant="outline-primary" onClick={() => navigate('/admin/users')}>
          Kullanıcı Listesine Dön
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="rounded-circle" 
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: '120px', height: '120px', fontSize: '2.5rem' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <h3>{user.name}</h3>
              <p className="text-muted mb-2">{user.email}</p>
              
              <div className="mb-3">
                <Badge 
                  bg={
                    user.role === 'admin' 
                      ? 'danger' 
                      : user.role === 'vendor' 
                        ? 'success' 
                        : 'primary'
                  }
                  className="me-2"
                >
                  {user.role === 'admin' 
                    ? 'Admin' 
                    : user.role === 'vendor' 
                      ? 'Satıcı' 
                      : 'Kullanıcı'
                  }
                </Badge>
                <Badge bg={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Aktif' : 'İnaktif'}
                </Badge>
              </div>
              
              <Button 
                variant={user.isActive ? 'danger' : 'success'} 
                onClick={handleToggleUserStatus}
                className="w-100"
              >
                {user.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
              </Button>
            </Card.Body>
            
            <ListGroup variant="flush">
              <ListGroup.Item>
                <small className="text-muted d-block">Kullanıcı ID</small>
                <span className="small">{user._id}</span>
              </ListGroup.Item>
              <ListGroup.Item>
                <small className="text-muted d-block">Kayıt Tarihi</small>
                {formatDate(user.createdAt)}
              </ListGroup.Item>
              <ListGroup.Item>
                <small className="text-muted d-block">Son Güncelleme</small>
                {formatDate(user.updatedAt)}
              </ListGroup.Item>
              {user.phone && (
                <ListGroup.Item>
                  <small className="text-muted d-block">Telefon</small>
                  {user.phone}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>
              <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="profile">Profil Bilgileri</Nav.Link>
                </Nav.Item>
                {orders && orders.length > 0 && (
                  <Nav.Item>
                    <Nav.Link eventKey="orders">Siparişler</Nav.Link>
                  </Nav.Item>
                )}
                {vendorProfile && (
                  <Nav.Item>
                    <Nav.Link eventKey="vendor">Satıcı Bilgileri</Nav.Link>
                  </Nav.Item>
                )}
              </Nav>
            </Card.Header>
            
            <Card.Body>
              {activeTab === 'profile' && (
                <div>
                  <h4 className="mb-4">Kullanıcı Profili</h4>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Header>Kişisel Bilgiler</Card.Header>
                        <ListGroup variant="flush">
                          <ListGroup.Item>
                            <strong>Ad Soyad:</strong> {user.name}
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <strong>E-posta:</strong> {user.email}
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <strong>Telefon:</strong> {user.phone || 'Belirtilmemiş'}
                          </ListGroup.Item>
                        </ListGroup>
                      </Card>
                    </Col>
                    
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Header>Adres Bilgileri</Card.Header>
                        <Card.Body>
                          {user.address ? (
                            <>
                              <p><strong>Adres:</strong> {user.address.street}</p>
                              <p><strong>Şehir:</strong> {user.address.city}</p>
                              <p><strong>Posta Kodu:</strong> {user.address.postalCode}</p>
                            </>
                          ) : (
                            <p className="text-muted">Adres bilgisi bulunamadı.</p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col>
                      <Card>
                        <Card.Header>Hesap Aktivitesi</Card.Header>
                        <Card.Body>
                          <p><strong>Son Giriş:</strong> {user.lastLogin ? formatDate(user.lastLogin) : 'Belirtilmemiş'}</p>
                          <p><strong>Sipariş Sayısı:</strong> {orders ? orders.length : 0}</p>
                          <p><strong>Hesap Durumu:</strong> <Badge bg={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Aktif' : 'İnaktif'}</Badge></p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
              
              {activeTab === 'orders' && orders && (
                <div>
                  <h4 className="mb-4">Siparişler</h4>
                  
                  {orders.length > 0 ? (
                    <Table striped responsive>
                      <thead>
                        <tr>
                          <th>Sipariş ID</th>
                          <th>Tarih</th>
                          <th>Tutar</th>
                          <th>Durum</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order._id}>
                            <td>{order._id.substring(0, 8)}...</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>₺{order.totalAmount.toFixed(2)}</td>
                            <td>
                              <Badge bg={
                                order.status === 'delivered' || order.status === 'completed' 
                                  ? 'success' 
                                  : order.status === 'cancelled' 
                                    ? 'danger' 
                                    : 'warning'
                              }>
                                {order.status === 'pending' && 'Beklemede'}
                                {order.status === 'accepted' && 'Kabul Edildi'}
                                {order.status === 'preparing' && 'Hazırlanıyor'}
                                {order.status === 'out_for_delivery' && 'Yolda'}
                                {order.status === 'delivered' && 'Teslim Edildi'}
                                {order.status === 'completed' && 'Tamamlandı'}
                                {order.status === 'cancelled' && 'İptal Edildi'}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => navigate(`/admin/orders/${order._id}`)}
                              >
                                Detay
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Bu kullanıcının henüz siparişi bulunmamaktadır.
                    </Alert>
                  )}
                </div>
              )}
              
              {activeTab === 'vendor' && vendorProfile && (
                <div>
                  <h4 className="mb-4">Satıcı Bilgileri</h4>
                  
                  <Card className="mb-3">
                    <Card.Header>Restoran Bilgileri</Card.Header>
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <strong>İşletme Adı:</strong> {vendorProfile.businessName}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Açıklama:</strong> {vendorProfile.description || 'Belirtilmemiş'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Telefon:</strong> {vendorProfile.phoneNumber || 'Belirtilmemiş'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Adres:</strong> {vendorProfile.address?.street} {vendorProfile.address?.city} {vendorProfile.address?.postalCode}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Durum:</strong> 
                        <Badge 
                          bg={
                            vendorProfile.status === 'active' 
                              ? 'success'
                              : vendorProfile.status === 'pending' 
                                ? 'warning'
                                : 'danger'
                          }
                          className="ms-2"
                        >
                          {vendorProfile.status === 'active' && 'Aktif'}
                          {vendorProfile.status === 'pending' && 'Onay Bekliyor'}
                          {vendorProfile.status === 'suspended' && 'Askıya Alındı'}
                          {vendorProfile.status === 'rejected' && 'Reddedildi'}
                        </Badge>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card>
                  
                  <div className="mt-3">
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/admin/vendors/${vendorProfile._id}`)}
                    >
                      Satıcı Detaylarına Git
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminUserDetail; 