import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge, ListGroup, Tab, Nav, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminVendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phoneNumber: '',
    description: '',
    address: {
      street: '',
      city: '',
      postalCode: ''
    },
    status: 'pending',
    isActive: true
  });
  
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  const [vendorStatus, setVendorStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Toast bildirimi için state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    variant: 'success'
  });
  
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
          fetchVendorDetail();
        }
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        navigate('/login');
      }
    };
    
    checkAdminAuth();
  }, [id, navigate]);
  
  // Satıcı detaylarını getir
  const fetchVendorDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/vendors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVendor(response.data);
      
      // Form verilerini doldur
      const vendorData = response.data;
      setFormData({
        name: vendorData.name || '',
        businessName: vendorData.businessName || '',
        email: vendorData.email || '',
        phoneNumber: vendorData.phoneNumber || '',
        description: vendorData.description || '',
        address: {
          street: vendorData.address?.street || '',
          city: vendorData.address?.city || '',
          postalCode: vendorData.address?.postalCode || ''
        },
        status: vendorData.status || 'pending',
        isActive: vendorData.isActive !== false
      });
      
      // Menü öğelerini ve siparişleri yükle
      fetchMenuItems();
      fetchVendorOrders();
    } catch (error) {
      console.error('Satıcı bilgileri alınamadı:', error);
      setError('Satıcı bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Satıcının menü öğelerini getir
  const fetchMenuItems = async () => {
    setMenuLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/vendors/${id}/menu-items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error('Menü öğeleri alınamadı:', error);
    } finally {
      setMenuLoading(false);
    }
  };
  
  // Satıcının siparişlerini getir
  const fetchVendorOrders = async () => {
    setOrderLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/vendors/${id}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Satıcı siparişleri alınamadı:', error);
    } finally {
      setOrderLoading(false);
    }
  };
  
  // Form değişiklikleri
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Satıcı bilgilerini güncelle
  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/vendors/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('Satıcı bilgileri başarıyla güncellendi');
      // Güncel bilgileri tekrar yükle
      fetchVendorDetail();
    } catch (error) {
      console.error('Satıcı güncellenirken hata:', error);
      setError('Satıcı bilgileri güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Satıcı durumunu değiştir
  const updateVendorStatus = async (status) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/vendors/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVendorStatus(status);
      setShowStatusModal(false);
      
      // Toast bildirimi göster
      setToast({
        show: true,
        message: `Satıcı durumu "${status}" olarak güncellendi`,
        variant: 'success'
      });
      
      setSuccessMessage(`Satıcı durumu "${status}" olarak güncellendi`);
      setFormData({
        ...formData,
        status
      });
      
      // Güncel satıcı bilgilerini yükle
      fetchVendorDetail();
    } catch (error) {
      console.error('Satıcı durumu güncellenirken hata:', error);
      
      let errorMsg = 'Satıcı durumu güncellenirken bir hata oluştu.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
          navigate('/login');
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      setError(errorMsg);
      
      // Hata bildirimi göster
      setToast({
        show: true,
        message: errorMsg,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok';
    
    const date = new Date(dateString);
    
    // Gün, ay, yıl formatı
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Saat ve dakika formatı
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Türkçe ay isimleri
    const turkishMonths = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    return `${day} ${turkishMonths[date.getMonth()]} ${year} ${hours}:${minutes}`;
  };
  
  // Sipariş durumu badge'i
  const getOrderStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'warning', text: 'Beklemede' },
      'processing': { bg: 'info', text: 'İşleniyor' },
      'in-transit': { bg: 'primary', text: 'Yolda' },
      'delivered': { bg: 'success', text: 'Teslim Edildi' },
      'cancelled': { bg: 'danger', text: 'İptal Edildi' }
    };
    
    const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
  };
  
  // Satıcı durumu badge'i
  const getVendorStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'warning', text: 'Onay Bekliyor' },
      'active': { bg: 'success', text: 'Aktif' },
      'suspended': { bg: 'danger', text: 'Askıya Alındı' },
      'rejected': { bg: 'danger', text: 'Reddedildi' }
    };
    
    const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
  };
  
  if (loading && !vendor) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Satıcı Detayları</h2>
        <Button variant="outline-primary" onClick={() => navigate('/admin/vendors')}>
          Satıcı Listesine Dön
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      {vendor && (
        <Tab.Container defaultActiveKey="details">
          <Row>
            <Col md={3}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  {vendor.logo ? (
                    <img 
                      src={vendor.logo} 
                      alt={vendor.businessName} 
                      className="img-fluid rounded-circle mb-3"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}
                    >
                      {vendor.businessName ? vendor.businessName.charAt(0).toUpperCase() : 'V'}
                    </div>
                  )}
                  <h4>{vendor.businessName}</h4>
                  <p className="text-muted">{vendor.email}</p>
                  {getVendorStatusBadge(vendor.status)}
                </Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <small className="text-muted d-block">Kayıt Tarihi</small>
                    {vendor.createdAt && formatDate(vendor.createdAt)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <small className="text-muted d-block">Son Güncelleme</small>
                    {vendor.updatedAt && formatDate(vendor.updatedAt)}
                  </ListGroup.Item>
                </ListGroup>
              </Card>
              
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="details">Satıcı Bilgileri</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="menu">Menü</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="orders">Siparişler</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="settings">Ayarlar</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            
            <Col md={9}>
              <Card>
                <Card.Body>
                  <Tab.Content>
                    {/* Satıcı Bilgileri Sekmesi */}
                    <Tab.Pane eventKey="details">
                      <h4 className="mb-4">Satıcı Bilgileri</h4>
                      <Form onSubmit={handleUpdateVendor}>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>İşletme Adı</Form.Label>
                              <Form.Control
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Yetkili Adı</Form.Label>
                              <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>E-posta</Form.Label>
                              <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Telefon</Form.Label>
                              <Form.Control
                                type="text"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Açıklama</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                        
                        <h5 className="mt-4 mb-3">Adres Bilgileri</h5>
                        <Row>
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label>Adres</Form.Label>
                              <Form.Control
                                type="text"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleInputChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Şehir</Form.Label>
                              <Form.Control
                                type="text"
                                name="address.city"
                                value={formData.address.city}
                                onChange={handleInputChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Posta Kodu</Form.Label>
                              <Form.Control
                                type="text"
                                name="address.postalCode"
                                value={formData.address.postalCode}
                                onChange={handleInputChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <div className="d-flex justify-content-between mt-4">
                          <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Kaydediliyor...
                              </>
                            ) : 'Değişiklikleri Kaydet'}
                          </Button>
                        </div>
                      </Form>
                    </Tab.Pane>
                    
                    {/* Menü Sekmesi */}
                    <Tab.Pane eventKey="menu">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">Menü Öğeleri</h4>
                      </div>
                      
                      {menuLoading ? (
                        <div className="text-center my-5">
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Yükleniyor...</span>
                          </Spinner>
                        </div>
                      ) : menuItems.length > 0 ? (
                        <div className="row row-cols-1 row-cols-md-2 g-4">
                          {menuItems.map(item => (
                            <div key={item._id} className="col">
                              <Card>
                                {item.imageUrl && (
                                  <Card.Img 
                                    variant="top" 
                                    src={item.imageUrl} 
                                    style={{ height: '160px', objectFit: 'cover' }}
                                  />
                                )}
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Card.Title>{item.name}</Card.Title>
                                    <Badge bg="primary">₺{item.price.toFixed(2)}</Badge>
                                  </div>
                                  <Card.Text className="small text-muted">{item.description}</Card.Text>
                                  {item.category && (
                                    <Badge bg="info" className="me-1">{item.category}</Badge>
                                  )}
                                  {item.isVegetarian && (
                                    <Badge bg="success">Vejetaryen</Badge>
                                  )}
                                </Card.Body>
                              </Card>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert variant="info">
                          Satıcıya ait menü öğesi bulunmamaktadır.
                        </Alert>
                      )}
                    </Tab.Pane>
                    
                    {/* Siparişler Sekmesi */}
                    <Tab.Pane eventKey="orders">
                      <h4 className="mb-4">Siparişler</h4>
                      
                      {orderLoading ? (
                        <div className="text-center my-5">
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Yükleniyor...</span>
                          </Spinner>
                        </div>
                      ) : orders.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Sipariş No</th>
                                <th>Tarih</th>
                                <th>Müşteri</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map(order => (
                                <tr key={order._id}>
                                  <td>#{order._id.substring(0, 8)}</td>
                                  <td>{formatDate(order.createdAt)}</td>
                                  <td>{order.user?.name || 'Bilinmiyor'}</td>
                                  <td>₺{order.totalAmount.toFixed(2)}</td>
                                  <td>{getOrderStatusBadge(order.status)}</td>
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
                          </table>
                        </div>
                      ) : (
                        <Alert variant="info">
                          Bu satıcıya ait sipariş bulunmamaktadır.
                        </Alert>
                      )}
                    </Tab.Pane>
                    
                    {/* Ayarlar Sekmesi */}
                    <Tab.Pane eventKey="settings">
                      <h4 className="mb-4">Satıcı Ayarları</h4>
                      
                      <Card className="mb-4">
                        <Card.Header>Durum Ayarları</Card.Header>
                        <Card.Body>
                          <Row className="mb-3">
                            <Col>
                              <h5>Mevcut Durum: {getVendorStatusBadge(formData.status)}</h5>
                            </Col>
                          </Row>
                          
                          <Row className="g-3">
                            <Col md={6} lg={3}>
                              <Button
                                variant="success"
                                className="w-100"
                                onClick={() => updateVendorStatus('active')}
                                disabled={formData.status === 'active' || loading}
                              >
                                Aktifleştir
                              </Button>
                            </Col>
                            <Col md={6} lg={3}>
                              <Button
                                variant="warning"
                                className="w-100"
                                onClick={() => updateVendorStatus('pending')}
                                disabled={formData.status === 'pending' || loading}
                              >
                                Onay Beklet
                              </Button>
                            </Col>
                            <Col md={6} lg={3}>
                              <Button
                                variant="danger"
                                className="w-100"
                                onClick={() => updateVendorStatus('suspended')}
                                disabled={formData.status === 'suspended' || loading}
                              >
                                Askıya Al
                              </Button>
                            </Col>
                            <Col md={6} lg={3}>
                              <Button
                                variant="danger"
                                className="w-100"
                                onClick={() => updateVendorStatus('rejected')}
                                disabled={formData.status === 'rejected' || loading}
                              >
                                Reddet
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                      
                      <Card className="border-warning">
                        <Card.Header className="bg-warning text-white">Dikkat</Card.Header>
                        <Card.Body>
                          <Card.Title>Satıcı Hesabını Yönet</Card.Title>
                          <Card.Text>
                            Bu bölümdeki işlemler satıcının hesabını ve verilerini etkileyecektir. Lütfen dikkatli olun.
                          </Card.Text>
                          
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="active-status"
                              label="Hesap Aktif"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                            />
                            <Form.Text className="text-muted">
                              Hesabı pasif yaparsanız, satıcı sisteme giriş yapamaz ve satışları gösterilmez.
                            </Form.Text>
                          </Form.Group>
                          
                          <Button 
                            variant="primary"
                            className="mt-2"
                            onClick={handleUpdateVendor}
                            disabled={loading}
                          >
                            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab.Container>
      )}
      
      {/* Toast Bildirimi */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <Toast 
          show={toast.show} 
          onClose={() => setToast({ ...toast, show: false })} 
          delay={5000} 
          autohide 
          bg={toast.variant}
          className="text-white"
        >
          <Toast.Header closeButton>
            <strong className="me-auto">
              {toast.variant === 'success' ? 'İşlem Başarılı' : 'Hata'}
            </strong>
          </Toast.Header>
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
      
      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Restoran Durumunu Güncelle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>{vendor?.businessName}</strong> adlı restoranın durumunu değiştirmek istediğinize emin misiniz?
          </p>
          <div className="d-grid gap-2 mt-3">
            <Button 
              variant="success"
              onClick={() => updateVendorStatus('active')}
              disabled={loading || vendorStatus === 'active'}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-check-circle me-2"></i> Aktif Yap
            </Button>
            <Button 
              variant="warning"
              onClick={() => updateVendorStatus('pending')}
              disabled={loading || vendorStatus === 'pending'}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-hourglass me-2"></i> Onay Bekleyen Yap
            </Button>
            <Button 
              variant="danger"
              onClick={() => updateVendorStatus('suspended')}
              disabled={loading || vendorStatus === 'suspended'}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-slash-circle me-2"></i> Askıya Al
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            İptal
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminVendorDetail; 