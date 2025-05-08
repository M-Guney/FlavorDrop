import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Table, Form, Spinner, Tabs, Tab, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaTruck, FaCalendarAlt, FaPhoneAlt, FaMapMarkerAlt, FaUserAlt, FaInfo } from 'react-icons/fa';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Siparişleri backend'den çek
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const userInfoStr = localStorage.getItem('userInfo');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      if (!userInfoStr) {
        setError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      // Kullanıcı bilgilerini JSON olarak parse et
      const userInfo = JSON.parse(userInfoStr);
      console.log('Kullanıcı bilgileri:', userInfo);
      
      // Kullanıcı rolü kontrol et
      if (userInfo.role !== 'vendor') {
        setError('Bu sayfaya erişim yetkiniz yok. Sadece satıcılar erişebilir.');
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      const vendorId = userInfo.id || userInfo._id;
      console.log('Satıcı ID:', vendorId);
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': vendorId
        }
      };
      
      // API isteğini düzeltilmiş yapılandırma ile gönder
      const response = await axios.get('http://localhost:5000/api/orders/vendor', config);
      
      if (response.data.success) {
        console.log('Satıcı siparişleri:', response.data.data);
        setOrders(response.data.data);
        setFilteredOrders(response.data.data);
      } else {
        setError('Siparişler alınamadı: ' + (response.data.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error.response || error);
      
      // Hata türüne göre farklı mesajlar göster
      if (error.response) {
        if (error.response.status === 401) {
          setError('Oturum süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.');
          // Token'ı temizle ve login sayfasına yönlendir
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 403) {
          setError('Bu işlemi yapmaya yetkiniz yok. Satıcı hesabınızla giriş yapmalısınız.');
        } else {
          setError(error.response.data?.message || 'Siparişler yüklenirken bir hata oluştu');
        }
      } else {
        setError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setStatusUpdateLoading(true);
      setProcessingOrderId(orderId);
      setUpdateError('');
      
      const token = localStorage.getItem('token');
      const userInfoStr = localStorage.getItem('userInfo');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      if (!userInfoStr) {
        setError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      // Kullanıcı bilgilerini JSON olarak parse et
      const userInfo = JSON.parse(userInfoStr);
      const vendorId = userInfo.id || userInfo._id;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Id': vendorId
        }
      };
      
      const response = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        config
      );
      
      if (response.data.success) {
        // Başarıyla güncellendi, siparişleri yenile
        await fetchOrders();
        
        // Modal'ı kapat eğer açıksa
        if (showModal) {
          setShowModal(false);
        }
        
        // Güncellenen siparişi seç
        const updatedOrder = response.data.data;
        setSelectedOrder(updatedOrder);
        
        // Başarı toast bildirimi göster
        const statusText = getStatusText(newStatus);
        const toastId = Date.now();
        setToasts(prev => [...prev, { 
          id: toastId, 
          message: `Sipariş durumu "${statusText}" olarak güncellendi`, 
          type: 'success' 
        }]);
        
        // 5 saniye sonra toast'ı kaldır
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      }
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error.response || error);
      
      // Hata bildirimi göster
      const toastId = Date.now();
      setToasts(prev => [...prev, { 
        id: toastId, 
        message: `Hata: ${error.response?.data?.message || 'Sipariş durumu güncellenemedi'}`, 
        type: 'danger' 
      }]);
      
      // 5 saniye sonra toast'ı kaldır
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);
      
      setUpdateError(error.response?.data?.message || 'Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setStatusUpdateLoading(false);
      setProcessingOrderId(null);
    }
  };

  // Durum filtreleme
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  // Sipariş detaylarını görüntüle
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Durum badge'i
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" className="status-badge">Beklemede</Badge>;
      case 'accepted':
        return <Badge bg="success" className="status-badge status-accepted">Kabul Edildi</Badge>;
      case 'preparing':
        return <Badge bg="primary" className="status-badge">Hazırlanıyor</Badge>;
      case 'out_for_delivery':
        return <Badge bg="secondary" className="status-badge">Yolda</Badge>;
      case 'delivered':
        return <Badge bg="success" className="status-badge">Teslim Edildi</Badge>;
      case 'completed':
        return <Badge bg="success" className="status-badge">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge bg="danger" className="status-badge">İptal Edildi</Badge>;
      default:
        return <Badge bg="light" text="dark" className="status-badge">Bilinmiyor</Badge>;
    }
  };
  
  // Türkçe durum metni
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'accepted': return 'Kabul Edildi';
      case 'preparing': return 'Hazırlanıyor';
      case 'out_for_delivery': return 'Yolda';
      case 'delivered': return 'Teslim Edildi';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };
  
  // Sipariş tutarı formatla
  const formatPrice = (price) => {
    return `₺${parseFloat(price).toFixed(2)}`;
  };
  
  // Tarih formatla
  const formatDate = (dateString) => {
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
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Siparişler yükleniyor...</p>
      </Container>
    );
  }

  // Stil için CSS kodunu ekleyin
  const styles = `
    .btn-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .btn-icon:hover {
      transform: scale(1.1);
    }
    
    .btn-outline-success:hover {
      background-color: #28a745;
      color: white;
    }
    
    .btn-outline-danger:hover {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-outline-primary:hover {
      background-color: #007bff;
      color: white;
    }
    
    .btn-outline-info:hover {
      background-color: #17a2b8;
      color: white;
    }

    .status-badge {
      font-size: 0.85rem;
      padding: 0.35rem 0.65rem;
    }
    
    .status-accepted {
      background-color: #28a745 !important;
      color: white;
      font-weight: bold;
    }
    
    tr.status-row-accepted {
      background-color: rgba(40, 167, 69, 0.05);
    }
  `;

  return (
    <Container className="py-4">
      <style>{styles}</style>
      <h2 className="mb-4">Sipariş Yönetimi</h2>
      
      {/* Toast Bildirimleri */}
      <ToastContainer 
        className="p-3" 
        position="top-end"
        style={{ zIndex: 1060 }}
      >
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            bg={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <Toast.Header closeButton={true}>
              <strong className="me-auto">
                {toast.type === 'success' ? 'İşlem Başarılı' : 'Hata'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toast.type === 'success' ? '' : 'text-white'}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h4 className="mb-0">Siparişleri Filtrele</h4>
            </Col>
            <Col md={4}>
              <Form.Select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Siparişler</option>
                <option value="pending">Bekleyen Siparişler</option>
                <option value="accepted">Kabul Edilen Siparişler</option>
                <option value="preparing">Hazırlanan Siparişler</option>
                <option value="out_for_delivery">Yoldaki Siparişler</option>
                <option value="delivered">Teslim Edilen Siparişler</option>
                <option value="completed">Tamamlanan Siparişler</option>
                <option value="cancelled">İptal Edilen Siparişler</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Tabs
        defaultActiveKey="pending"
        className="mb-4"
        onSelect={(k) => setStatusFilter(k === 'all' ? 'all' : k)}
      >
        <Tab eventKey="all" title="Tümü" />
        <Tab eventKey="pending" title="Bekleyen" />
        <Tab eventKey="accepted" title="Kabul Edilen" />
        <Tab eventKey="preparing" title="Hazırlanan" />
        <Tab eventKey="out_for_delivery" title="Yolda" />
        <Tab eventKey="delivered" title="Teslim Edilen" />
        <Tab eventKey="completed" title="Tamamlanan" />
        <Tab eventKey="cancelled" title="İptal Edilen" />
      </Tabs>
      
      {filteredOrders.length === 0 ? (
        <Alert variant="info">
          {statusFilter === 'all' 
            ? 'Henüz hiç sipariş bulunmuyor.' 
            : `${getStatusText(statusFilter)} durumunda sipariş bulunmuyor.`}
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Sipariş ID</th>
                  <th>Müşteri</th>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr 
                    key={order._id} 
                    className={`${processingOrderId === order._id ? "bg-light" : ""} ${order.status === 'accepted' ? "status-row-accepted" : ""}`}
                  >
                    <td>#{order._id.substring(order._id.length - 6)}</td>
                    <td>{order.userName}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <div className="d-flex gap-2 justify-content-center">
                        {/* Bekleyen siparişler için hızlı kabul et/reddet butonları */}
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline-success"
                              size="sm"
                              onClick={() => updateOrderStatus(order._id, 'accepted')}
                              disabled={statusUpdateLoading && processingOrderId === order._id}
                              className="btn-icon rounded-circle"
                              title="Siparişi Kabul Et"
                            >
                              {statusUpdateLoading && processingOrderId === order._id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </Button>
                            <Button 
                              variant="outline-danger"
                              size="sm"
                              onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              disabled={statusUpdateLoading && processingOrderId === order._id}
                              className="btn-icon rounded-circle"
                              title="Siparişi Reddet"
                            >
                              {statusUpdateLoading && processingOrderId === order._id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaTimesCircle />
                              )}
                            </Button>
                          </>
                        )}
                        
                        {/* Kabul edilmiş siparişler için hızlı hazırlamaya başla butonu */}
                        {order.status === 'accepted' && (
                          <Button 
                            variant="outline-primary"
                            size="sm"
                            onClick={() => updateOrderStatus(order._id, 'preparing')}
                            disabled={statusUpdateLoading && processingOrderId === order._id}
                            className="btn-icon rounded-circle"
                            title="Hazırlanmaya Başladı"
                          >
                            {statusUpdateLoading && processingOrderId === order._id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <i className="bi bi-box"></i>
                            )}
                          </Button>
                        )}
                        
                        {/* Hazırlanan siparişler için hızlı yola çıktı butonu */}
                        {order.status === 'preparing' && (
                          <Button 
                            variant="outline-info"
                            size="sm"
                            onClick={() => updateOrderStatus(order._id, 'out_for_delivery')}
                            disabled={statusUpdateLoading && processingOrderId === order._id}
                            className="btn-icon rounded-circle"
                            title="Yola Çıktı"
                          >
                            {statusUpdateLoading && processingOrderId === order._id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaTruck />
                            )}
                          </Button>
                        )}
                        
                        {/* Yoldaki siparişler için hızlı teslim edildi butonu */}
                        {order.status === 'out_for_delivery' && (
                          <Button 
                            variant="outline-success"
                            size="sm"
                            onClick={() => updateOrderStatus(order._id, 'delivered')}
                            disabled={statusUpdateLoading && processingOrderId === order._id}
                            className="btn-icon rounded-circle"
                            title="Teslim Edildi"
                          >
                            {statusUpdateLoading && processingOrderId === order._id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaCheckCircle />
                            )}
                          </Button>
                        )}

                        {/* Her durum için detay butonu */}
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          title="Detayları Görüntüle"
                          className="btn-icon rounded-circle"
                        >
                          <FaInfo />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Sipariş Detay Modalı */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Sipariş Detayı #{selectedOrder?._id.substring(selectedOrder?._id.length - 6)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              {updateError && (
                <Alert variant="danger" className="mb-3">
                  {updateError}
                </Alert>
              )}
              
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>
                      <h5 className="mb-0"><FaUserAlt className="me-2" /> Müşteri Bilgileri</h5>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Ad Soyad:</strong> {selectedOrder.userName}</p>
                      <p>
                        <strong><FaPhoneAlt className="me-2" /> Telefon:</strong> {selectedOrder.contactPhone}
                      </p>
                      <p>
                        <strong><FaMapMarkerAlt className="me-2" /> Teslimat Adresi:</strong> {selectedOrder.deliveryAddress}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>
                      <h5 className="mb-0"><FaCalendarAlt className="me-2" /> Sipariş Bilgileri</h5>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Sipariş Tarihi:</strong> {formatDate(selectedOrder.createdAt)}</p>
                      <p><strong>Sipariş Durumu:</strong> {getStatusBadge(selectedOrder.status)}</p>
                      <p><strong>Ödeme Yöntemi:</strong> {selectedOrder.paymentMethod === 'cash' ? 'Nakit' : 'Kredi Kartı'}</p>
                      <p><strong>Toplam Tutar:</strong> {formatPrice(selectedOrder.totalAmount)}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Sipariş Öğeleri</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Ürün</th>
                        <th>Fiyat</th>
                        <th>Adet</th>
                        <th>Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Toplam:</strong></td>
                        <td><strong>{formatPrice(selectedOrder.totalAmount)}</strong></td>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Sipariş Durumu Güncelle</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Sipariş durumunu güncellemek için aşağıdaki işlemlerden birini seçin.
                  </p>
                  
                  <div className="d-flex gap-2 flex-wrap">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => updateOrderStatus(selectedOrder._id, 'accepted')}
                          disabled={statusUpdateLoading && processingOrderId === selectedOrder._id}
                        >
                          {statusUpdateLoading && processingOrderId === selectedOrder._id ? (
                            <><Spinner size="sm" animation="border" className="me-2" /> İşleniyor...</>
                          ) : (
                            <><FaCheckCircle className="me-2" /> Siparişi Kabul Et</>
                          )}
                        </Button>
                        
                        <Button
                          variant="danger"
                          onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                          disabled={statusUpdateLoading && processingOrderId === selectedOrder._id}
                        >
                          {statusUpdateLoading && processingOrderId === selectedOrder._id ? (
                            <><Spinner size="sm" animation="border" className="me-2" /> İşleniyor...</>
                          ) : (
                            <><FaTimesCircle className="me-2" /> Siparişi Reddet</>
                          )}
                        </Button>
                      </>
                    )}
                    
                    {selectedOrder.status === 'accepted' && (
                      <Button
                        variant="primary"
                        onClick={() => updateOrderStatus(selectedOrder._id, 'preparing')}
                        disabled={statusUpdateLoading && processingOrderId === selectedOrder._id}
                      >
                        {statusUpdateLoading && processingOrderId === selectedOrder._id ? (
                          <><Spinner size="sm" animation="border" className="me-2" /> İşleniyor...</>
                        ) : (
                          <><FaCheckCircle className="me-2" /> Hazırlanmaya Başladı</>
                        )}
                      </Button>
                    )}
                    
                    {selectedOrder.status === 'preparing' && (
                      <Button
                        variant="info"
                        onClick={() => updateOrderStatus(selectedOrder._id, 'out_for_delivery')}
                        disabled={statusUpdateLoading && processingOrderId === selectedOrder._id}
                      >
                        {statusUpdateLoading && processingOrderId === selectedOrder._id ? (
                          <><Spinner size="sm" animation="border" className="me-2" /> İşleniyor...</>
                        ) : (
                          <><FaTruck className="me-2" /> Teslimata Çıktı</>
                        )}
                      </Button>
                    )}
                    
                    {selectedOrder.status === 'out_for_delivery' && (
                      <Button
                        variant="success"
                        onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                        disabled={statusUpdateLoading && processingOrderId === selectedOrder._id}
                      >
                        {statusUpdateLoading && processingOrderId === selectedOrder._id ? (
                          <><Spinner size="sm" animation="border" className="me-2" /> İşleniyor...</>
                        ) : (
                          <><FaCheckCircle className="me-2" /> Teslim Edildi</>
                        )}
                      </Button>
                    )}
                    
                    {(selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                      <Alert variant="info" className="w-100 mb-0">
                        {selectedOrder.status === 'delivered' && 'Sipariş teslim edildi. Müşteri onayı bekleniyor.'}
                        {selectedOrder.status === 'completed' && 'Sipariş tamamlandı. Başka bir işlem yapılamaz.'}
                        {selectedOrder.status === 'cancelled' && 'Sipariş iptal edildi. Başka bir işlem yapılamaz.'}
                      </Alert>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendorOrders; 