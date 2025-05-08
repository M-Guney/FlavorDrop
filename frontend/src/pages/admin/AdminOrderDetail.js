import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Spinner, Alert, Table, ListGroup } from 'react-bootstrap';
import axios from 'axios';

const AdminOrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Admin yetkisini kontrol et
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
          fetchOrderDetails();
        }
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        setError('Admin yetkiniz doğrulanamadı.');
        navigate('/login');
      }
    };
    
    checkAdminAuth();
  }, [id, navigate]);
  
  // Sipariş detaylarını getir
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Oturum bilgileri bulunamadı');
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setOrder(response.data.data);
    } catch (error) {
      console.error('Sipariş detayı getirme hatası:', error);
      setError('Sipariş detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Sipariş durumunu güncelle
  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      setUpdateSuccess('');
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Oturum bilgileri bulunamadı');
        return;
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/orders/${id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Güncel sipariş bilgilerini almak için tekrar çağrı yap
      fetchOrderDetails();
      setUpdateSuccess('Sipariş durumu başarıyla güncellendi');
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setUpdateSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Sipariş durumu güncelleme hatası:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };
  
  // Sipariş durumuna göre badge rengi
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'in-transit':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Sipariş durumu Türkçe çevirisi
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'processing':
        return 'İşleniyor';
      case 'in-transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
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
  
  // Ödeme yöntemi Türkçe çevirisi
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit_card':
        return 'Kredi Kartı';
      case 'debit_card':
        return 'Banka Kartı';
      case 'cash':
        return 'Nakit';
      case 'online_payment':
        return 'Online Ödeme';
      default:
        return method;
    }
  };

  return (
    <div className="admin-order-detail py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Sipariş Detayı</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/admin/orders')}>
          Siparişlere Dön
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {updateSuccess && <Alert variant="success">{updateSuccess}</Alert>}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Sipariş detayları yükleniyor...</p>
        </div>
      ) : !order ? (
        <Alert variant="warning">
          Sipariş bulunamadı veya erişim izniniz yok.
        </Alert>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={8}>
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Sipariş Özeti</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={6} md={3} className="mb-3">
                      <div className="text-muted small">Sipariş ID</div>
                      <div className="fw-bold">#{order._id.slice(-6)}</div>
                    </Col>
                    <Col xs={6} md={3} className="mb-3">
                      <div className="text-muted small">Tarih</div>
                      <div>{formatDate(order.createdAt)}</div>
                    </Col>
                    <Col xs={6} md={3} className="mb-3">
                      <div className="text-muted small">Toplam Tutar</div>
                      <div className="fw-bold">₺{order.totalAmount.toFixed(2)}</div>
                    </Col>
                    <Col xs={6} md={3} className="mb-3">
                      <div className="text-muted small">Durum</div>
                      <Badge bg={getStatusBadge(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </Col>
                  </Row>
                  
                  <Row className="mt-2">
                    <Col xs={12} md={6} className="mb-3">
                      <div className="text-muted small">Ödeme Yöntemi</div>
                      <div>{getPaymentMethodText(order.paymentMethod)}</div>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <div className="text-muted small">Ödeme Durumu</div>
                      <Badge bg={order.isPaid ? 'success' : 'warning'}>
                        {order.isPaid ? 'Ödendi' : 'Ödenmedi'}
                      </Badge>
                      {order.isPaid && order.paidAt && (
                        <span className="ms-2 small text-muted">
                          ({formatDate(order.paidAt)})
                        </span>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Sipariş Öğeleri</h5>
                </Card.Header>
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Ürün</th>
                      <th>Adet</th>
                      <th>Birim Fiyat</th>
                      <th>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                                className="rounded"
                              />
                            )}
                            <div>
                              <div className="fw-bold">{item.name}</div>
                              {item.description && (
                                <small className="text-muted d-block">{item.description}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₺{item.price.toFixed(2)}</td>
                        <td>₺{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-group-divider">
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">Ara Toplam:</td>
                      <td>₺{order.subtotal ? order.subtotal.toFixed(2) : order.totalAmount.toFixed(2)}</td>
                    </tr>
                    {order.taxAmount > 0 && (
                      <tr>
                        <td colSpan="3" className="text-end">KDV:</td>
                        <td>₺{order.taxAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    {order.deliveryFee > 0 && (
                      <tr>
                        <td colSpan="3" className="text-end">Teslimat Ücreti:</td>
                        <td>₺{order.deliveryFee.toFixed(2)}</td>
                      </tr>
                    )}
                    {order.discount > 0 && (
                      <tr>
                        <td colSpan="3" className="text-end">İndirim:</td>
                        <td>-₺{order.discount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="3" className="text-end fw-bold fs-5">Genel Toplam:</td>
                      <td className="fw-bold fs-5">₺{order.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </Card>
              
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Sipariş Geçmişi</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    order.statusHistory.map((history, index) => (
                      <ListGroup.Item key={index}>
                        <div className="d-flex justify-content-between">
                          <div>
                            <Badge bg={getStatusBadge(history.status)}>
                              {getStatusText(history.status)}
                            </Badge>
                            {history.notes && (
                              <span className="ms-2">{history.notes}</span>
                            )}
                          </div>
                          <div className="text-muted small">
                            {formatDate(history.timestamp)}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>Sipariş geçmişi bulunamadı.</ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="sticky-top shadow-sm mb-4" style={{ top: '1rem' }}>
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Müşteri Bilgileri</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="text-muted small">İsim</div>
                    <div className="fw-bold">{order.user?.name || 'Bilinmiyor'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">E-posta</div>
                    <div>{order.user?.email || 'Bilinmiyor'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Telefon</div>
                    <div>{order.user?.phone || 'Bilinmiyor'}</div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Teslimat Bilgileri</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="text-muted small">Adres</div>
                    <div>
                      {order.shippingAddress?.address || 'Bilinmiyor'}<br/>
                      {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                    </div>
                  </div>
                  {order.shippingAddress?.notes && (
                    <div className="mb-3">
                      <div className="text-muted small">Notlar</div>
                      <div>{order.shippingAddress.notes}</div>
                    </div>
                  )}
                </Card.Body>
              </Card>
              
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Restoran Bilgileri</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="text-muted small">Restoran</div>
                    <div className="fw-bold">{order.vendor?.name || 'Bilinmiyor'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Telefon</div>
                    <div>{order.vendor?.phone || 'Bilinmiyor'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Adres</div>
                    <div>{order.vendor?.address || 'Bilinmiyor'}</div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Durum Güncelleme</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        variant="primary"
                        onClick={() => updateOrderStatus('processing')}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Güncelleniyor...
                          </>
                        ) : 'İşleme Al'}
                      </Button>
                    )}
                    
                    {order.status === 'processing' && (
                      <Button 
                        variant="primary"
                        onClick={() => updateOrderStatus('in-transit')}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Güncelleniyor...
                          </>
                        ) : 'Yola Çıkar'}
                      </Button>
                    )}
                    
                    {order.status === 'in-transit' && (
                      <Button 
                        variant="success"
                        onClick={() => updateOrderStatus('delivered')}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Güncelleniyor...
                          </>
                        ) : 'Teslim Edildi Olarak İşaretle'}
                      </Button>
                    )}
                    
                    {['pending', 'processing'].includes(order.status) && (
                      <Button 
                        variant="danger"
                        onClick={() => updateOrderStatus('cancelled')}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Güncelleniyor...
                          </>
                        ) : 'Siparişi İptal Et'}
                      </Button>
                    )}
                    
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <Alert variant={order.status === 'delivered' ? 'success' : 'danger'}>
                        Bu sipariş {order.status === 'delivered' ? 'teslim edilmiş' : 'iptal edilmiş'} durumda ve artık güncellenemez.
                      </Alert>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AdminOrderDetail; 