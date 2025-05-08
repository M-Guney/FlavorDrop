import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, ListGroup, Alert, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  
  const navigate = useNavigate();
  
  // Siparişleri getir
  useEffect(() => {
    const fetchOrders = async () => {
      try {
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
        
        const response = await axios.get('http://localhost:5000/api/orders/user', config);
        console.log('Siparişler:', response.data);
        
        // Siparişleri ayarla
        setOrders(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Siparişleri getirme hatası:', error);
        setError('Siparişler yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [navigate]);
  
  // Sipariş durumuna göre badge rengi belirle
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'out_for_delivery':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Sipariş durumunu Türkçe'ye çevir
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'accepted':
        return 'Kabul Edildi';
      case 'preparing':
        return 'Hazırlanıyor';
      case 'out_for_delivery':
        return 'Dağıtımda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };
  
  // Sipariş detaylarını görüntüle
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };
  
  // Sipariş iptal et
  const cancelOrder = async (orderId) => {
    try {
      setCancellingOrder(true);
      
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, config);
      
      // Siparişleri yeniden yükle
      const response = await axios.get('http://localhost:5000/api/orders/user', config);
      setOrders(response.data.data);
      
      // Modal'ı kapat
      setShowOrderDetails(false);
    } catch (error) {
      console.error('Sipariş iptal hatası:', error);
      setError('Sipariş iptal edilirken bir hata oluştu');
    } finally {
      setCancellingOrder(false);
    }
  };
  
  // Siparişin teslim edildiğini onayla
  const confirmDelivery = async (orderId) => {
    try {
      setConfirmingDelivery(true);
      
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.put(`http://localhost:5000/api/orders/${orderId}/confirm-delivery`, {}, config);
      
      // Siparişleri yeniden yükle
      const response = await axios.get('http://localhost:5000/api/orders/user', config);
      setOrders(response.data.data);
      
      // Modal'ı kapat
      setShowOrderDetails(false);
    } catch (error) {
      console.error('Teslimat onay hatası:', error);
      setError('Teslimat onaylanırken bir hata oluştu');
    } finally {
      setConfirmingDelivery(false);
    }
  };
  
  // Tarih formatını düzenle
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Aktif siparişler (tamamlanmamış ve iptal edilmemiş)
  const activeOrders = orders.filter(
    order => !['completed', 'cancelled'].includes(order.status)
  );
  
  // Geçmiş siparişler (tamamlanmış veya iptal edilmiş)
  const pastOrders = orders.filter(
    order => ['completed', 'cancelled'].includes(order.status)
  );
  
  // Yükleme durumu
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <h2>Siparişler Yükleniyor...</h2>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Siparişlerim</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {orders.length === 0 ? (
        <Card className="mb-4 shadow-sm">
          <Card.Body className="text-center py-5">
            <h3>Henüz Siparişiniz Bulunmamaktadır</h3>
            <p className="text-muted">İlk siparişinizi oluşturmak için restoranları keşfedin.</p>
            <Button 
              variant="primary" 
              className="mt-3"
              onClick={() => navigate('/vendors')}
            >
              Restoranları Keşfet
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Tabs defaultActiveKey="active" className="mb-4">
          <Tab eventKey="active" title={`Aktif Siparişler (${activeOrders.length})`}>
            <Card className="shadow-sm">
              <Card.Body>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <p>Aktif sipariş bulunmamaktadır</p>
                  </div>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Sipariş ID</th>
                        <th>Restoran</th>
                        <th>Tarih</th>
                        <th>Toplam</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders.map(order => (
                        <tr key={order._id}>
                          <td>#{order._id.substring(order._id.length - 5)}</td>
                          <td>{order.vendorName}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{order.totalAmount.toFixed(2)} ₺</td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => viewOrderDetails(order)}
                            >
                              Detaylar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="past" title={`Geçmiş Siparişler (${pastOrders.length})`}>
            <Card className="shadow-sm">
              <Card.Body>
                {pastOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <p>Geçmiş sipariş bulunmamaktadır</p>
                  </div>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Sipariş ID</th>
                        <th>Restoran</th>
                        <th>Tarih</th>
                        <th>Toplam</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastOrders.map(order => (
                        <tr key={order._id}>
                          <td>#{order._id.substring(order._id.length - 5)}</td>
                          <td>{order.vendorName}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{order.totalAmount.toFixed(2)} ₺</td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => viewOrderDetails(order)}
                            >
                              Detaylar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}
      
      {/* Sipariş Detay Modalı */}
      <Modal
        show={showOrderDetails}
        onHide={() => setShowOrderDetails(false)}
        size="lg"
        centered
      >
        {selectedOrder && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                Sipariş Detayı #{selectedOrder._id.substring(selectedOrder._id.length - 5)}
              </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Sipariş Bilgileri</h5>
                  <p>
                    <strong>Tarih:</strong> {formatDate(selectedOrder.createdAt)}<br />
                    <strong>Durum:</strong>{' '}
                    <Badge bg={getStatusBadgeVariant(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge><br />
                    <strong>Ödeme Yöntemi:</strong>{' '}
                    {selectedOrder.paymentMethod === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                  </p>
                </Col>
                
                <Col md={6}>
                  <h5>Restoran Bilgileri</h5>
                  <p>
                    <strong>Ad:</strong> {selectedOrder.vendorName}<br />
                    {selectedOrder.vendor.phoneNumber && (
                      <>
                        <strong>Telefon:</strong> {selectedOrder.vendor.phoneNumber}<br />
                      </>
                    )}
                  </p>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={12}>
                  <h5>Teslimat Bilgileri</h5>
                  <p>
                    <strong>Adres:</strong> {selectedOrder.deliveryAddress}<br />
                    <strong>Telefon:</strong> {selectedOrder.contactPhone}
                  </p>
                </Col>
              </Row>
              
              <h5>Sipariş Öğeleri</h5>
              <ListGroup className="mb-4">
                {selectedOrder.items.map((item, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold">{item.quantity}x</span> {item.name}
                      {item.specialInstructions && (
                        <small className="text-muted d-block">
                          Not: {item.specialInstructions}
                        </small>
                      )}
                    </div>
                    <div className="text-end">
                      {(item.price * item.quantity).toFixed(2)} ₺
                    </div>
                  </ListGroup.Item>
                ))}
                
                <ListGroup.Item className="d-flex justify-content-between fw-bold">
                  <div>Toplam</div>
                  <div>{selectedOrder.totalAmount.toFixed(2)} ₺</div>
                </ListGroup.Item>
              </ListGroup>
              
              {selectedOrder.status === 'pending' && (
                <Alert variant="info">
                  Siparişiniz restoran tarafından onay bekliyor. İptal etmek isterseniz "Siparişi İptal Et" düğmesine tıklayabilirsiniz.
                </Alert>
              )}
              
              {selectedOrder.status === 'preparing' && (
                <Alert variant="info">
                  Siparişiniz restoran tarafından hazırlanıyor.
                </Alert>
              )}
              
              {selectedOrder.status === 'out_for_delivery' && (
                <Alert variant="info">
                  Siparişiniz yolda! Teslimat tamamlandığında "Teslimatı Onayla" düğmesine tıklayabilirsiniz.
                </Alert>
              )}
              
              {selectedOrder.status === 'delivered' && (
                <Alert variant="success">
                  Siparişiniz teslim edildi. Eğer teslimatı onaylamak isterseniz "Teslimatı Onayla" düğmesine tıklayabilirsiniz.
                </Alert>
              )}
              
              {selectedOrder.status === 'completed' && (
                <Alert variant="success">
                  Siparişiniz tamamlanmıştır. Afiyet olsun!
                </Alert>
              )}
              
              {selectedOrder.status === 'cancelled' && (
                <Alert variant="danger">
                  Bu sipariş iptal edilmiştir.
                </Alert>
              )}
            </Modal.Body>
            
            <Modal.Footer>
              {['pending', 'accepted'].includes(selectedOrder.status) && (
                <Button 
                  variant="danger" 
                  onClick={() => cancelOrder(selectedOrder._id)}
                  disabled={cancellingOrder}
                >
                  {cancellingOrder ? 'İptal Ediliyor...' : 'Siparişi İptal Et'}
                </Button>
              )}
              
              {selectedOrder.status === 'out_for_delivery' && (
                <Button 
                  variant="success" 
                  onClick={() => confirmDelivery(selectedOrder._id)}
                  disabled={confirmingDelivery}
                >
                  {confirmingDelivery ? 'Onaylanıyor...' : 'Teslimatı Onayla'}
                </Button>
              )}
              
              <Button variant="secondary" onClick={() => setShowOrderDetails(false)}>
                Kapat
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default OrdersPage; 