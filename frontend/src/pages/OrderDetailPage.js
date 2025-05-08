import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, ListGroup, Alert, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';

const OrderDetailPage = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Oturum bilgileri bulunamadı');
          navigate('/login');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get(`http://localhost:5000/api/orders/${id}`, config);
        
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError(response.data.message || 'Sipariş detayları alınamadı');
        }
      } catch (error) {
        console.error('Sipariş detayı getirme hatası:', error);
        setError('Sipariş detayları yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, navigate]);
  
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Sipariş Detayı</h1>
        <Button as={Link} to="/orders" variant="outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Siparişlere Dön
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
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
          <Card className="mb-4 shadow-sm">
            <Card.Header as="h5" className="bg-primary text-white">
              Sipariş Özeti
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3} sm={6} className="mb-3 mb-md-0">
                  <div className="text-muted">Sipariş ID</div>
                  <div className="fw-bold">#{order._id.slice(-6)}</div>
                </Col>
                <Col md={3} sm={6} className="mb-3 mb-md-0">
                  <div className="text-muted">Tarih</div>
                  <div>{formatDate(order.createdAt)}</div>
                </Col>
                <Col md={3} sm={6} className="mb-3 mb-md-0">
                  <div className="text-muted">Durum</div>
                  <Badge bg={getStatusBadge(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted">Toplam Tutar</div>
                  <div className="fw-bold fs-5">₺{order.totalAmount.toFixed(2)}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Row>
            <Col md={8}>
              <Card className="mb-4 shadow-sm">
                <Card.Header as="h5" className="bg-light">
                  Sipariş Öğeleri
                </Card.Header>
                <ListGroup variant="flush">
                  {order.items.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row className="align-items-center">
                        <Col md={8} xs={12} className="mb-2 mb-md-0">
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="me-3 rounded" 
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div className="fw-bold">{item.name}</div>
                              <small className="text-muted">{item.description}</small>
                            </div>
                          </div>
                        </Col>
                        <Col md={2} xs={6} className="text-md-center">
                          <span className="d-block d-md-none text-muted">Adet:</span>
                          {item.quantity} adet
                        </Col>
                        <Col md={2} xs={6} className="text-end">
                          <span className="d-block d-md-none text-muted">Fiyat:</span>
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <Card.Footer className="bg-white">
                  <Row className="text-end">
                    <Col>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Ara Toplam:</span>
                        <span>₺{order.subtotal ? order.subtotal.toFixed(2) : order.totalAmount.toFixed(2)}</span>
                      </div>
                      
                      {order.taxAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>KDV:</span>
                          <span>₺{order.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {order.deliveryFee > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Teslimat Ücreti:</span>
                          <span>₺{order.deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {order.discount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>İndirim:</span>
                          <span className="text-danger">-₺{order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top">
                        <span>Toplam:</span>
                        <span>₺{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </Col>
                  </Row>
                </Card.Footer>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="mb-4 shadow-sm">
                <Card.Header as="h5" className="bg-light">
                  Teslimat Bilgileri
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>Adres:</strong> {order.shippingAddress?.address}
                  </p>
                  <p className="mb-1">
                    <strong>Şehir:</strong> {order.shippingAddress?.city}
                  </p>
                  <p className="mb-1">
                    <strong>Posta Kodu:</strong> {order.shippingAddress?.postalCode}
                  </p>
                  {order.shippingAddress?.notes && (
                    <p className="mb-1">
                      <strong>Notlar:</strong> {order.shippingAddress.notes}
                    </p>
                  )}
                </Card.Body>
              </Card>
              
              <Card className="mb-4 shadow-sm">
                <Card.Header as="h5" className="bg-light">
                  Ödeme Bilgileri
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>Ödeme Yöntemi:</strong> {getPaymentMethodText(order.paymentMethod)}
                  </p>
                  <p className="mb-1">
                    <strong>Ödeme Durumu:</strong>{' '}
                    <Badge bg={order.isPaid ? 'success' : 'warning'}>
                      {order.isPaid ? 'Ödendi' : 'Ödenmedi'}
                    </Badge>
                  </p>
                  {order.isPaid && order.paidAt && (
                    <p className="mb-1">
                      <strong>Ödeme Tarihi:</strong> {formatDate(order.paidAt)}
                    </p>
                  )}
                </Card.Body>
              </Card>
              
              <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-light">
                  Restoran Bilgisi
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>Restoran:</strong> {order.vendor?.name || order.vendor?.businessName}
                  </p>
                  <p className="mb-1">
                    <strong>Telefon:</strong> {order.vendor?.phoneNumber}
                  </p>
                  <p className="mb-0">
                    <strong>Adres:</strong>{' '}
                    {order.vendor?.address?.street}, {order.vendor?.address?.city}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default OrderDetailPage; 