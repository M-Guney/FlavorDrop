import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Form, Button, Card, Pagination, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    vendorUsers: 0,
    normalUsers: 0
  });
  
  const navigate = useNavigate();
  const usersPerPage = 10;
  
  useEffect(() => {
    // Admin kontrolü
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
          fetchUserStatistics();
          fetchUsers();
        }
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        navigate('/login');
      }
    };
    
    checkAdminAuth();
  }, [navigate]);
  
  const fetchUserStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/admin/user-statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatistics(response.data);
    } catch (error) {
      console.error('Kullanıcı istatistikleri alınamadı:', error);
      setError('Kullanıcı istatistikleri yüklenirken bir hata oluştu.');
    }
  };
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: usersPerPage,
          search: searchTerm,
          role: roleFilter !== 'all' ? roleFilter : undefined
        }
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error);
      setError('Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);
  
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/users/admin/users/${userId}/toggle-status`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Kullanıcı listesini ve istatistikleri güncelle
      fetchUsers();
      fetchUserStatistics();
    } catch (error) {
      console.error('Kullanıcı durumu güncellenemedi:', error);
      setError('Kullanıcı durumu güncellenirken bir hata oluştu.');
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
  };
  
  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Filtre değiştiğinde ilk sayfaya dön
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const renderPagination = () => {
    let items = [];
    
    // İlk sayfa düğmesi
    items.push(
      <Pagination.First 
        key="first" 
        onClick={() => handlePageChange(1)} 
        disabled={currentPage === 1}
      />
    );
    
    // Önceki sayfa düğmesi
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
      />
    );
    
    // Sayfa numaraları
    for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={page === currentPage} 
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Sonraki sayfa düğmesi
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
      />
    );
    
    // Son sayfa düğmesi
    items.push(
      <Pagination.Last 
        key="last" 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPage === totalPages}
      />
    );
    
    return <Pagination>{items}</Pagination>;
  };
  
  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Kullanıcı Yönetimi</h2>
      
      {/* İstatistik Kartları */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="text-center h-100 bg-light">
            <Card.Body>
              <h3>{statistics.totalUsers}</h3>
              <Card.Text>Toplam Kullanıcı</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="text-center h-100 bg-success text-white">
            <Card.Body>
              <h3>{statistics.activeUsers}</h3>
              <Card.Text>Aktif Kullanıcı</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="text-center h-100 bg-danger text-white">
            <Card.Body>
              <h3>{statistics.inactiveUsers}</h3>
              <Card.Text>İnaktif Kullanıcı</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 bg-info text-white">
            <Card.Body>
              <h3>{statistics.adminUsers}</h3>
              <Card.Text>Admin Kullanıcı</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Hata Mesajı */}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Arama ve Filtreleme */}
      <Row className="mb-4">
        <Col md={8}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="İsim veya e-posta ile kullanıcı ara..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Select value={roleFilter} onChange={handleRoleFilter}>
              <option value="all">Tüm Roller</option>
              <option value="user">Kullanıcı</option>
              <option value="vendor">Satıcı</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      {/* Kullanıcı Tablosu */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Kullanıcılar yükleniyor...</p>
        </div>
      ) : (
        <>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Durum</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user._id.substring(0, 8)}...</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge 
                        bg={
                          user.role === 'admin' 
                            ? 'danger' 
                            : user.role === 'vendor' 
                              ? 'success' 
                              : 'primary'
                        }
                      >
                        {user.role === 'admin' 
                          ? 'Admin' 
                          : user.role === 'vendor' 
                            ? 'Satıcı' 
                            : 'Kullanıcı'
                        }
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Aktif' : 'İnaktif'}
                      </Badge>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <Button
                        as={Link}
                        to={`/admin/users/${user._id}`}
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                      >
                        Detay
                      </Button>
                      <Button
                        variant={user.isActive ? 'outline-danger' : 'outline-success'}
                        size="sm"
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                      >
                        {user.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-3">
                    Kullanıcı bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          
          {/* Sayfalama */}
          <div className="d-flex justify-content-center mt-4">
            {renderPagination()}
          </div>
        </>
      )}
    </Container>
  );
};

export default AdminUsers; 