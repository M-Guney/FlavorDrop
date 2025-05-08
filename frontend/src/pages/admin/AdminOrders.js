import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Card, Form, InputGroup, Spinner, Alert, Pagination } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ordersPerPage = 10;
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL'den query parametrelerini al
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [location]);
  
  // Admin yetkisini kontrol et
  useEffect(() => {
    const checkAdminAuth = () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return false;
      }
      
      return true;
    };
    
    if (!checkAdminAuth()) return;
    
    fetchOrders(currentPage);
  }, [navigate, currentPage, statusFilter]);
  
  // Siparişleri getir
  const fetchOrders = async (page) => {
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
      
      // API parametreleri oluştur
      let url = `http://localhost:5000/api/admin/orders?page=${page}&limit=${ordersPerPage}`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      const response = await axios.get(url, config);
      
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setTotalPages(Math.ceil(response.data.data.total / ordersPerPage));
      } else {
        setError(response.data.message || 'Siparişler alınamadı');
      }
    } catch (error) {
      console.error('Admin siparişleri getirme hatası:', error);
      setError('Siparişler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Sipariş durumunu güncelle
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Oturum bilgileri bulunamadı');
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.put(
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        config
      );
      
      if (response.data.success) {
        // Başarılı güncelleme sonrası orders dizisini güncelle
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        setError(response.data.message || 'Sipariş durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      setError('Sipariş durumu güncellenirken bir hata oluştu');
    }
  };
  
  // Arama formunu gönder
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Arama yaparken ilk sayfaya dön
    fetchOrders(1);
  };
  
  // Durum filtresini değiştir
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Filtre değişirken ilk sayfaya dön
  };
  
  // Sayfalama işlevi
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
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

  return (
    <div className="admin-orders py-4">
      <h1 className="mb-4">Sipariş Yönetimi</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <div className="d-flex flex-wrap gap-3 mb-3">
              <div className="flex-grow-1">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Sipariş ID, müşteri adı veya restoran adına göre ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="primary">
                    Ara
                  </Button>
                </InputGroup>
              </div>
              
              <div style={{ minWidth: '200px' }}>
                <Form.Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Beklemede</option>
                  <option value="processing">İşleniyor</option>
                  <option value="in-transit">Yolda</option>
                  <option value="delivered">Teslim Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </Form.Select>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Siparişler yükleniyor...</p>
        </div>
      ) : orders.length === 0 ? (
        <Alert variant="info">
          Belirtilen kriterlere uygun sipariş bulunamadı.
        </Alert>
      ) : (
        <>
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Sipariş ID</th>
                      <th>Müşteri</th>
                      <th>Restoran</th>
                      <th>Tutar</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id}>
                        <td>
                          <small className="text-muted">#{order._id.slice(-6)}</small>
                        </td>
                        <td>{order.user?.name || 'Bilinmiyor'}</td>
                        <td>{order.vendor?.name || 'Bilinmiyor'}</td>
                        <td>₺{order.totalAmount.toFixed(2)}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <Badge bg={getStatusBadge(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => navigate(`/admin/orders/${order._id}`)}
                            >
                              Detay
                            </Button>
                            
                            {order.status === 'pending' && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => updateOrderStatus(order._id, 'processing')}
                              >
                                İşleme Al
                              </Button>
                            )}
                            
                            {order.status === 'processing' && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => updateOrderStatus(order._id, 'in-transit')}
                              >
                                Yola Çıkar
                              </Button>
                            )}
                            
                            {order.status === 'in-transit' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateOrderStatus(order._id, 'delivered')}
                              >
                                Teslim Et
                              </Button>
                            )}
                            
                            {['pending', 'processing'].includes(order.status) && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              >
                                İptal
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
          
          {/* Sayfalama */}
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.First
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />
              
              {[...Array(totalPages).keys()].map(number => (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === currentPage}
                  onClick={() => paginate(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
              
              <Pagination.Next
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders; 