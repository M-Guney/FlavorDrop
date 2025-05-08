import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Card, Row, Col, Form, InputGroup, Badge, Spinner, Alert, Modal, Image, Toast, ToastContainer } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaEdit, FaTrash, FaStore, FaFilter, FaEye, FaCheck, FaBan, FaSync } from 'react-icons/fa';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [vendorToUpdateStatus, setVendorToUpdateStatus] = useState(null);
  
  // Toast bildirimi için state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    variant: 'success'
  });

  const navigate = useNavigate();
  const itemsPerPage = 10;
  const API_BASE_URL = 'http://localhost:5000/api';
  const VENDOR_API_ENDPOINT = `${API_BASE_URL}/users/admin/vendors`;
  const MAX_RETRY_ATTEMPTS = 3;

  // Admin yetkisi kontrolü ve restoranları getirme
  useEffect(() => {
    // Admin yetkisini kontrol et
    const checkAdminAuth = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          navigate('/login');
          return false;
        }
        
        const userInfo = JSON.parse(userInfoStr);
        if (!userInfo || userInfo.role !== 'admin') {
          navigate('/login');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Kullanıcı bilgisi kontrolü sırasında hata:', error);
        navigate('/login');
        return false;
      }
    };
    
    // Sayfa yüklendiğinde admin yetkisi kontrolü
    if (!checkAdminAuth()) return;
    
    // Restoranları getir
    fetchVendors();
  }, [navigate, page, filterStatus]);

  // Token kontrolü
  const checkAndRefreshToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Oturum bilgileri bulunamadı');
      navigate('/login');
      return null;
    }
    
    // Token geçerliliğini kontrol et
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Geçersiz token yapısı');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      // Token süresi dolmuşsa veya dolmak üzereyse
      if (expirationTime < currentTime || expirationTime - currentTime < 5 * 60 * 1000) {
        // Token yenileme işlemi (gerçek uygulamada burada refresh token kullanılır)
        console.warn('Token süresi dolmuş veya dolmak üzere, yönlendiriliyor...');
        localStorage.removeItem('token');
        navigate('/login');
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Token kontrolü sırasında hata:', error);
      localStorage.removeItem('token');
      navigate('/login');
      return null;
    }
  }, [navigate]);

  // Restoranları getir - yeniden yazıldı
  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await checkAndRefreshToken();
      if (!token) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 saniye timeout
      };
      
      // Filtreleme ve sayfalama parametreleri
      const params = {
        page,
        limit: itemsPerPage
      };
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Geçici olarak normal vendors endpoint'ini kullan
      const response = await axios.get(`${API_BASE_URL}/vendors`, {
        ...config,
        params
      });
      
      if (response.data.success) {
        // Veri formatı backend ile uyumlu olmayabilir, uyarla
        const vendorData = response.data.data || [];
        const formattedVendors = Array.isArray(vendorData) ? vendorData : [];
        
        setVendors(formattedVendors);
        setTotalPages(Math.ceil(formattedVendors.length / itemsPerPage) || 1);
        setRetryCount(0); // Başarılı olduğunda yeniden deneme sayacını sıfırla
      } else {
        throw new Error(response.data.message || 'Restoranlar alınamadı');
      }
    } catch (error) {
      console.error('Restoranları getirme hatası:', error);
      
      // Hata mesajını belirle
      let errorMsg = 'Restoranlar yüklenirken bir hata oluştu';
      
      if (error.response) {
        // Sunucu yanıtı ile dönen hatalar
        if (error.response.status === 401) {
          errorMsg = 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 403) {
          errorMsg = 'Bu işlem için yetkiniz bulunmuyor';
        } else if (error.response.status === 404) {
          errorMsg = 'Restoran verisi bulunamadı';
        } else if (error.response.status >= 500) {
          errorMsg = 'Sunucu hatası, lütfen daha sonra tekrar deneyin';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMsg = 'Sunucu yanıt vermedi, bağlantınızı kontrol edin';
      } else if (error.request) {
        errorMsg = 'Sunucuya ulaşılamıyor, internet bağlantınızı kontrol edin';
      }
      
      setError(errorMsg);
      
      // Belirli durumlarda yeniden deneyin
      if (
        (error.code === 'ECONNABORTED' || 
         !error.response || 
         (error.response && error.response.status >= 500)) && 
        retryCount < MAX_RETRY_ATTEMPTS
      ) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        
        // Üstel geri çekilme ile yeniden dene
        const delay = Math.min(1000 * Math.pow(2, nextRetryCount), 10000);
        console.log(`${nextRetryCount}. deneme ${delay}ms sonra yapılacak...`);
        
        setTimeout(() => {
          fetchVendors();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [checkAndRefreshToken, filterStatus, navigate, page, retryCount, searchTerm, itemsPerPage]);

  // Restoran silme işlemi
  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    
    try {
      setLoading(true);
      
      const token = await checkAndRefreshToken();
      if (!token) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(
        `${API_BASE_URL}/vendors/${vendorToDelete._id}`,
        config
      );
      
      if (response.data && response.data.success) {
        // Silinen restoranı listeden kaldır
        setVendors(vendors.filter(vendor => vendor._id !== vendorToDelete._id));
        setShowDeleteModal(false);
        setVendorToDelete(null);
        
        // Bildirim göster
        setToast({
          show: true,
          message: `${vendorToDelete.businessName} başarıyla silindi`,
          variant: 'success'
        });
      } else {
        throw new Error(response.data?.message || 'Restoran silinemedi');
      }
    } catch (error) {
      console.error('Restoran silme hatası:', error);
      
      let errorMsg = 'Restoran silinirken bir hata oluştu';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
        } else if (error.response.status === 403) {
          errorMsg = 'Bu işlem için yetkiniz bulunmuyor';
        } else if (error.response.status === 404) {
          errorMsg = 'Silinecek restoran bulunamadı';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      setError(errorMsg);
      
      // Hata durumunda bildirim göster
      setToast({
        show: true,
        message: errorMsg,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  // Restoran durumunu güncelleme
  const handleUpdateVendorStatus = async (newStatus) => {
    if (!vendorToUpdateStatus) return;
    
    try {
      setLoading(true);
      
      const token = await checkAndRefreshToken();
      if (!token) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Henüz backend'de admin/vendors/:id/status endpoint'i yok
      // Bu işlevi uygulamak için geçici olarak normal vendor güncelleme kullan
      const response = await axios.patch(
        `${API_BASE_URL}/vendors/${vendorToUpdateStatus._id}`,
        { status: newStatus },
        config
      );
      
      if (response.data && response.data.success) {
        // Restoran durumunu güncelle
        setVendors(vendors.map(vendor => 
          vendor._id === vendorToUpdateStatus._id 
            ? { ...vendor, status: newStatus } 
            : vendor
        ));
        setShowStatusModal(false);
        setVendorToUpdateStatus(null);
        
        // Durum güncellendiğinde başarılı bildirim göster
        setToast({
          show: true,
          message: `${vendorToUpdateStatus.businessName} durumu başarıyla güncellendi`,
          variant: 'success'
        });
      } else {
        throw new Error(response.data?.message || 'Restoran durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Restoran durumu güncelleme hatası:', error);
      
      let errorMsg = 'Restoran durumu güncellenirken bir hata oluştu';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
        } else if (error.response.status === 403) {
          errorMsg = 'Bu işlem için yetkiniz bulunmuyor';
        } else if (error.response.status === 404) {
          errorMsg = 'Güncellenecek restoran bulunamadı';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      setError(errorMsg);
      
      // Hata durumunda bildirim göster
      setToast({
        show: true,
        message: errorMsg,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  // Arama işlemi
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Aramada ilk sayfaya dön
    setRetryCount(0); // Yeniden deneme sayacını sıfırla
    fetchVendors();
  };

  // Durum rozeti oluşturma
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Aktif</Badge>;
      case 'pending':
        return <Badge bg="warning">Onay Bekliyor</Badge>;
      case 'suspended':
        return <Badge bg="danger">Askıya Alındı</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Silme onayı modali
  const confirmDelete = (vendor) => {
    setVendorToDelete(vendor);
    setShowDeleteModal(true);
  };

  // Durum güncelleme modali
  const confirmStatusUpdate = (vendor) => {
    setVendorToUpdateStatus(vendor);
    setShowStatusModal(true);
  };

  // Verileri yeniden yükle
  const handleRetry = () => {
    setRetryCount(0);
    fetchVendors();
  };

  // Yükleme bileşenini ayrı bir değişken olarak tanımla
  const loadingContent = (
    <div className="text-center py-5" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">
        {retryCount > 0 
          ? `Restoranlar yükleniyor... (${retryCount}/${MAX_RETRY_ATTEMPTS} deneme)` 
          : 'Restoranlar yükleniyor...'}
      </p>
    </div>
  );

  // Boş içerik bileşenini ayrı bir değişken olarak tanımla
  const emptyContent = (
    <tr>
      <td colSpan="7" className="text-center py-4" style={{ minHeight: '300px' }}>
        <Alert variant="light" className="mb-0">
          {error ? 'Restoran verisi bulunamadı' : 'Bu kriterlere uygun restoran bulunamadı'}
          {!error && (
            <div className="mt-3">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleRetry}
                className="me-2"
              >
                <FaSync className="me-1" /> Yenile
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                as={Link} 
                to="/admin/vendors/create"
              >
                <FaStore className="me-1" /> Yeni Restoran Ekle
              </Button>
            </div>
          )}
        </Alert>
      </td>
    </tr>
  );

  return (
    <div className="admin-vendors py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="mb-0">Restoran Yönetimi</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/admin/vendors/create" 
            variant="primary"
          >
            <FaStore className="me-2" />
            Yeni Restoran
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={handleRetry}>
            <FaSync className="me-1" /> Yeniden Dene
          </Button>
        </Alert>
      )}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6} className="mb-3 mb-md-0">
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="İşletme adı, adres veya ID ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" type="submit" disabled={loading}>
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col md={4} lg={3} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1); // Filtrelemede ilk sayfaya dön
                    setRetryCount(0); // Yeniden deneme sayacını sıfırla
                  }}
                  disabled={loading}
                >
                  <option value="all">Tüm Durum</option>
                  <option value="active">Aktif</option>
                  <option value="pending">Onay Bekliyor</option>
                  <option value="suspended">Askıya Alınmış</option>
                </Form.Select>
              </InputGroup>
            </Col>
            
            <Col xs="auto" className="ms-auto">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setPage(1);
                  setRetryCount(0);
                  fetchVendors();
                }}
                disabled={loading}
              >
                Filtreleri Temizle
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Sabit yükseklik ile titreme önleme */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th>#</th>
                <th>Restoran</th>
                <th>Adres</th>
                <th>İletişim</th>
                <th>Durum</th>
                <th>Ürün Sayısı</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody style={{ minHeight: loading ? '400px' : 'auto' }}>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-0" style={{ height: '400px' }}>
                    {loadingContent}
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                emptyContent
              ) : (
                vendors.map((vendor, index) => (
                  <tr key={vendor._id}>
                    <td>{(page - 1) * itemsPerPage + index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="me-3" style={{ width: '50px', height: '50px' }}>
                          {vendor.logo ? (
                            <div style={{ width: '50px', height: '50px', overflow: 'hidden' }}>
                              <Image 
                                src={vendor.logo} 
                                alt={vendor.businessName} 
                                width={50} 
                                height={50} 
                                className="rounded object-fit-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50?text=Logo';
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                          ) : (
                            <div 
                              className="bg-light d-flex align-items-center justify-content-center rounded"
                              style={{ width: '50px', height: '50px' }}
                            >
                              <FaStore />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="fw-bold">{vendor.businessName}</div>
                          <small className="text-muted">
                            {vendor.user ? vendor.user.name : 'N/A'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {vendor.address ? (
                        <div>
                          <div>{vendor.address.city}, {vendor.address.state || ''}</div>
                          <small className="text-muted">{vendor.address.street || ''}</small>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {vendor.phoneNumber || 'N/A'}
                      {vendor.user && vendor.user.email && (
                        <div>
                          <small className="text-muted">{vendor.user.email}</small>
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(vendor.status || 'pending')}</td>
                    <td className="text-center">
                      {vendor.menuItems?.length || 0}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button 
                          as={Link} 
                          to={`/admin/vendors/${vendor._id}`}
                          variant="outline-info" 
                          size="sm"
                          title="Görüntüle"
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          as={Link} 
                          to={`/admin/vendors/${vendor._id}/edit`}
                          variant="outline-primary" 
                          size="sm"
                          title="Düzenle"
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          title="Durum Değiştir"
                          onClick={() => confirmStatusUpdate(vendor)}
                        >
                          {vendor.status === 'active' ? <FaBan /> : <FaCheck />}
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          title="Sil"
                          onClick={() => confirmDelete(vendor)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setPage(prev => prev - 1)}
                disabled={page === 1 || loading}
              >
                Önceki
              </button>
            </li>
            
            {[...Array(totalPages).keys()].map(num => (
              <li 
                key={num + 1} 
                className={`page-item ${page === num + 1 ? 'active' : ''}`}
              >
                <button 
                  className="page-link" 
                  onClick={() => setPage(num + 1)}
                  disabled={loading}
                >
                  {num + 1}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setPage(prev => prev + 1)}
                disabled={page === totalPages || loading}
              >
                Sonraki
              </button>
            </li>
          </ul>
        </div>
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
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Restoran Silme Onayı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {vendorToDelete && (
            <p>
              <strong>{vendorToDelete.businessName}</strong> adlı restoranı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm menü öğeleri, siparişler ve ilgili veriler silinecektir.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteVendor}
            disabled={loading}
          >
            {loading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Restoran Durumu Güncelleme</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {vendorToUpdateStatus && (
            <div>
              <p>
                <strong>{vendorToUpdateStatus.businessName}</strong> adlı restoranın durumunu değiştirmek istediğinize emin misiniz?
              </p>
              <div className="d-grid gap-2 mt-3">
                <Button 
                  variant="success"
                  onClick={() => handleUpdateVendorStatus('active')}
                  disabled={loading || vendorToUpdateStatus.status === 'active'}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaCheck className="me-2" /> Aktif Yap
                </Button>
                <Button 
                  variant="warning"
                  onClick={() => handleUpdateVendorStatus('pending')}
                  disabled={loading || vendorToUpdateStatus.status === 'pending'}
                  className="d-flex align-items-center justify-content-center"
                >
                  <span className="me-2">⏱️</span> Onay Bekleyen Yap
                </Button>
                <Button 
                  variant="danger"
                  onClick={() => handleUpdateVendorStatus('suspended')}
                  disabled={loading || vendorToUpdateStatus.status === 'suspended'}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaBan className="me-2" /> Askıya Al
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            İptal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminVendors; 