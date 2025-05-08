import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal durumları
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0
  });
  
  const navigate = useNavigate();
  
  // Kategori seçenekleri
  const categoryOptions = [
    'Ana Yemek',
    'Çorba',
    'Salata',
    'Tatlı',
    'İçecek',
    'Aperatif',
    'Kahvaltı',
    'Özel Menü'
  ];
  
  useEffect(() => {
    const fetchMenuItems = async () => {
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
        
        // Kullanıcı bilgilerini localStorage'dan al
        const storedUserInfo = localStorage.getItem('userInfo');
        if (!storedUserInfo) {
          navigate('/login');
          return;
        }
        
        const userInfo = JSON.parse(storedUserInfo);
        if (userInfo.role !== 'vendor') {
          navigate('/');
          return;
        }
        
        // Satıcının kendi menüsünü getir
        const res = await axios.get('http://localhost:5000/api/vendors/my-menu', config);
        
        if (res.data.success) {
          setMenuItems(res.data.data);
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Menü öğeleri yüklenirken bir hata oluştu'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenuItems();
  }, [navigate]);
  
  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      spicyLevel: item.spicyLevel || 0
    });
    setShowEditModal(true);
  };
  
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    });
  };
  
  const updateMenuItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.put(
        `http://localhost:5000/api/vendors/menu/${selectedItem._id}`,
        editFormData,
        config
      );
      
      if (res.data.success) {
        // Başarılı mesajını göster
        setSuccess('Menü öğesi başarıyla güncellendi');
        setTimeout(() => setSuccess(''), 3000);
        
        // Listeyi güncelle
        setMenuItems(menuItems.map(item => 
          item._id === selectedItem._id ? res.data.data : item
        ));
        
        // Modalı kapat
        setShowEditModal(false);
      }
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Menü öğesi güncellenirken bir hata oluştu'
      );
    }
  };
  
  const toggleAvailability = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.put(
        `http://localhost:5000/api/vendors/menu/${id}`,
        { isAvailable: !currentStatus },
        config
      );
      
      if (res.data.success) {
        // Listeyi güncelle
        setMenuItems(menuItems.map(item => 
          item._id === id ? { ...item, isAvailable: !currentStatus } : item
        ));
        
        // Başarılı mesajını göster
        setSuccess(`Menü öğesi durumu ${!currentStatus ? 'aktif' : 'pasif'} olarak güncellendi`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Menü öğesi durumu güncellenirken bir hata oluştu'
      );
    }
  };
  
  const deleteMenuItem = async (id) => {
    if (window.confirm('Bu menü öğesini silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const res = await axios.delete(`http://localhost:5000/api/vendors/menu/${id}`, config);
        
        if (res.data.success) {
          // Listeyi güncelle
          setMenuItems(menuItems.filter(item => item._id !== id));
          
          // Başarılı mesajını göster
          setSuccess('Menü öğesi başarıyla silindi');
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Menü öğesi silinirken bir hata oluştu'
        );
      }
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          Yükleniyor...
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Menü Yönetimi</h2>
                <div>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/vendor/dashboard')}
                    className="me-2"
                  >
                    Geri Dön
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => navigate('/vendor/menu/add')}
                  >
                    Yeni Menü Öğesi Ekle
                  </Button>
                </div>
              </div>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              {menuItems.length === 0 ? (
                <Alert variant="info">
                  Henüz hiç menü öğesi eklenmemiş. "Yeni Menü Öğesi Ekle" butonuna tıklayarak menünüzü oluşturmaya başlayabilirsiniz.
                </Alert>
              ) : (
                <Table responsive bordered hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Ürün Adı</th>
                      <th>Fiyat</th>
                      <th>Kategori</th>
                      <th>Durum</th>
                      <th>Özellikler</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.name}</strong>
                          <div className="text-muted small">{item.description}</div>
                        </td>
                        <td>{item.price.toFixed(2)} ₺</td>
                        <td>{item.category}</td>
                        <td>
                          <Badge bg={item.isAvailable ? 'success' : 'secondary'}>
                            {item.isAvailable ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </td>
                        <td>
                          {item.isVegetarian && <Badge bg="success" className="me-1">Vejetaryen</Badge>}
                          {item.isVegan && <Badge bg="info" className="me-1">Vegan</Badge>}
                          {item.isGlutenFree && <Badge bg="warning" className="me-1">Glutensiz</Badge>}
                          {item.spicyLevel > 0 && (
                            <Badge bg="danger">
                              Acı Seviyesi: {item.spicyLevel}
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            className="me-2"
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant={item.isAvailable ? 'outline-secondary' : 'outline-success'}
                            size="sm"
                            onClick={() => toggleAvailability(item._id, item.isAvailable)}
                            className="me-2"
                          >
                            {item.isAvailable ? 'Pasif Yap' : 'Aktif Yap'}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteMenuItem(item._id)}
                          >
                            Sil
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Düzenleme Modalı */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Menü Öğesi Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Ürün Adı</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleEditFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={editFormData.description}
                onChange={handleEditFormChange}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="price">
                  <Form.Label>Fiyat (₺)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="category">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditFormChange}
                  >
                    {categoryOptions.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="isAvailable">
                  <Form.Check
                    type="switch"
                    label="Aktif"
                    name="isAvailable"
                    checked={editFormData.isAvailable}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="spicyLevel">
                  <Form.Label>Acı Seviyesi (0-3)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="3"
                    name="spicyLevel"
                    value={editFormData.spicyLevel}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="isVegetarian">
                  <Form.Check
                    type="checkbox"
                    label="Vejetaryen"
                    name="isVegetarian"
                    checked={editFormData.isVegetarian}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="isVegan">
                  <Form.Check
                    type="checkbox"
                    label="Vegan"
                    name="isVegan"
                    checked={editFormData.isVegan}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="isGlutenFree">
                  <Form.Check
                    type="checkbox"
                    label="Glutensiz"
                    name="isGlutenFree"
                    checked={editFormData.isGlutenFree}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={updateMenuItem}>
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendorMenu; 