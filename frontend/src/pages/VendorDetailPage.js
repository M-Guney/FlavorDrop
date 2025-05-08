import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Tab, Nav, Table, Badge, Button, Alert, Modal, Form, Spinner, Image, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('menu');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [cartSuccess, setCartSuccess] = useState({ show: false, item: null });
  
  // Rezervasyon modal durumları
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [orderNote, setOrderNote] = useState('');
  
  // debug amaçlı token kontrolü
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Mevcut token:', token ? token.substring(0, 20) + '...' : 'Yok');
  }, []);
  
  // Bugünün tarihini alıp gün ismini bulmak için
  const getDayName = (date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };
  
  const today = new Date();
  const currentDay = getDayName(today);
  
  // Tarihi formatlama fonksiyonu
  const formatDate = (date) => {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };
  
  // Saat dilimlerini hesapla
  const calculateTimeSlots = useCallback((dayInfo) => {
    if (!dayInfo || !dayInfo.isOpen) return [];
    
    const slots = [];
    const [openHour, openMinute] = dayInfo.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayInfo.closeTime.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    // Çalışma saatleri içindeki tüm zaman dilimlerini hesapla
    while (
      currentHour < closeHour || 
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // Sonraki zaman dilimini hesapla
      currentMinute += dayInfo.slotDurationMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  }, []);
  
  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        // Satıcı detaylarını getir
        const { data: vendorData } = await axios.get(`http://localhost:5000/api/vendors/${id}`);
        
        if (vendorData.success) {
          setVendor(vendorData.data);
          
          // Satıcının menüsünü getir
          const { data: menuData } = await axios.get(`http://localhost:5000/api/vendors/${id}/menu`);
          
          if (menuData.success) {
            setMenuItems(menuData.data);
          }
          
          // Müsaitlik bilgilerini getir
          const userToken = localStorage.getItem('token');
          if (userToken) {
            try {
              const config = {
                headers: {
                  Authorization: `Bearer ${userToken}`
                }
              };
              
              const { data: availabilityData } = await axios.get(
                `http://localhost:5000/api/vendors/${id}/availability`,
                config
              );
              
              if (availabilityData.success) {
                // Günleri doğru sırada dizme
                const dayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                const sortedAvailability = [...availabilityData.data].sort((a, b) => {
                  return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                });
                
                setAvailability(sortedAvailability);
              }
            } catch (error) {
              console.log('Müsaitlik bilgileri alınamadı, devam ediliyor...');
            }
          }
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Restoran bilgileri yüklenirken bir hata oluştu'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorDetails();
  }, [id]);
  
  const openReservationModal = (day) => {
    const selectedDayInfo = availability.find(a => a.day === day);
    
    if (selectedDayInfo && selectedDayInfo.isOpen) {
      setSelectedDay(selectedDayInfo);
      const slots = calculateTimeSlots(selectedDayInfo);
      setAvailableSlots(slots);
      setSelectedSlot('');
      setOrderNote('');
      setReservationError('');
      setReservationSuccess(false);
      setShowReservationModal(true);
    } else {
      alert(`${day} günü için rezervasyon alınmamaktadır.`);
    }
  };
  
  const makeReservation = async () => {
    if (!selectedSlot) {
      setReservationError('Lütfen bir zaman dilimi seçin');
      return;
    }
    
    const userToken = localStorage.getItem('token');
    if (!userToken) {
      navigate('/login', { state: { from: `/vendor/${id}` } });
      return;
    }
    
    try {
      setReservationLoading(true);
      setReservationError('');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        }
      };
      
      // Günün tarihini hesapla
      const today = new Date();
      const dayIndex = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].indexOf(selectedDay.day);
      const dayDiff = dayIndex - today.getDay();
      const reservationDate = new Date(today);
      reservationDate.setDate(today.getDate() + (dayDiff >= 0 ? dayDiff : dayDiff + 7));
      
      const { data } = await axios.post(
        `http://localhost:5000/api/reservations`,
        {
          vendor: id,
          date: reservationDate.toISOString().split('T')[0],
          time: selectedSlot,
          note: orderNote
        },
        config
      );
      
      if (data.success) {
        setReservationSuccess(true);
        
        // 3 saniye sonra modalı kapat
        setTimeout(() => {
          setShowReservationModal(false);
        }, 3000);
      }
    } catch (error) {
      setReservationError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Rezervasyon oluşturulurken bir hata oluştu'
      );
    } finally {
      setReservationLoading(false);
    }
  };

  // Kategori gruplarına göre menü öğelerini grupla
  const getMenuByCategories = () => {
    const categories = {};
    
    menuItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    
    return categories;
  };

  const closeAddToCartModal = () => {
    setShowCartModal(false);
    setSelectedItem(null);
    setQuantity(1);
    setSpecialInstructions('');
    setCartError('');
    setCartSuccess({ show: false, item: null });
  };

  // Sepete direkt olarak ekleme (miktar kontrolü olmadan)
  const quickAddToCart = (item) => {
    try {
      setAddingToCart(true);
      
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      // Kullanıcı giriş yapmadıysa login sayfasına yönlendir
      if (!token || !userInfo) {
        // Öğeyi localStorage'a kaydet
        const cartItem = {
          menuItemId: item._id,
          menuItem: item,
          quantity: 1,
          specialInstructions: ''
        };
        
        localStorage.setItem('pendingCartItem', JSON.stringify(cartItem));
        navigate('/login');
        return;
      }
      
      // Kullanıcı giriş yapmışsa API isteği gönder
      const postData = async () => {
        try {
          const config = {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          };
          
          const response = await axios.post(
            'http://localhost:5000/api/cart',
            {
              menuItemId: item._id,
              quantity: 1,
              notes: ''
            },
            config
          );
          
          if (response.data.success) {
            alert(`${item.name} sepete eklendi!`);
            window.dispatchEvent(new Event('storage'));
            document.dispatchEvent(new CustomEvent('cartUpdated'));
          }
        } catch (error) {
          console.error('API hatası:', error);
          alert('Ürün sepete eklenirken bir hata oluştu!');
        } finally {
          setAddingToCart(false);
        }
      };
      
      postData();
    } catch (error) {
      console.error('Hızlı sepet ekleme hatası:', error);
      alert('Ürün eklenirken bir hata oluştu!');
      setAddingToCart(false);
    }
  };

  const handleAddToCart = async () => {
    // Quantity validation
    if (quantity < 1) {
      setCartError('Lütfen geçerli bir miktar girin');
      return;
    }

    setAddingToCart(true);
    setCartError('');
    
    try {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      // Kullanıcı giriş yapmadıysa direkt olarak geçici sepete ekleyelim
      if (!token || !userInfo) {
        // Ürün benzersiz ID'si oluştur
        const tempItemId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Geçici sepet öğesini oluştur
        const cartItem = {
          _id: tempItemId,
          menuItemId: selectedItem._id,
          menuItem: {
            _id: selectedItem._id,
            name: selectedItem.name,
            price: selectedItem.price,
            description: selectedItem.description,
            image: selectedItem.image
          },
          quantity: quantity,
          notes: specialInstructions,
          vendorId: id
        };
        
        // pendingCartItem olarak kaydet ve login sayfasına yönlendir
        localStorage.setItem('pendingCartItem', JSON.stringify(cartItem));
        navigate('/login');
        return;
      }
      
      // Kullanıcı giriş yapmışsa normal API çağrısı yap
      console.log('Sepete ekleme isteği gönderiliyor:', {
        menuItemId: selectedItem._id,
        quantity: quantity,
        notes: specialInstructions
      });

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.post(
        'http://localhost:5000/api/cart',
        {
          menuItemId: selectedItem._id,
          quantity: quantity,
          notes: specialInstructions
        },
        config
      );

      console.log('Sepete ekleme yanıtı:', response.data);
      
      // API'den başarılı yanıt geldiğinde
      setCartSuccess({ show: true, item: selectedItem });
      
      // Storage event'i tetikle ki header sepet sayısını güncellesin
      window.dispatchEvent(new Event('storage'));
      
      // Özel bir event de tetikleyelim
      document.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // Kullanıcıya başarılı mesajını göster ve sepet sayfasına yönlendir
      setTimeout(() => {
        closeAddToCartModal();
        navigate('/cart');
      }, 1500);
      
    } catch (error) {
      console.error('Sepete ekleme hatası:', error);
      setCartError(error.response?.data?.error || error.response?.data?.message || 'Sepete eklenirken bir hata oluştu');
    } finally {
      setAddingToCart(false);
    }
  };

  const openAddToCartModal = (item) => {
    setSelectedItem(item);
    setShowCartModal(true);
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Restoran bilgileri yükleniyor...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/vendors')}>
          Restoranlar Sayfasına Dön
        </Button>
      </Container>
    );
  }

  if (!vendor) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Restoran bulunamadı
        </Alert>
        <Button variant="primary" onClick={() => navigate('/vendors')}>
          Restoranlar Sayfasına Dön
        </Button>
      </Container>
    );
  }

  const menuByCategories = getMenuByCategories();

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Button
            variant="outline-secondary"
            className="mb-3"
            onClick={() => navigate('/vendors')}
          >
            ← Restoranlar
          </Button>
          
          <Row className="align-items-center">
            <Col md={3} className="text-center text-md-start">
              <img 
                src={vendor.logo !== 'no-photo.jpg' ? vendor.logo : 'https://via.placeholder.com/150?text=Logo'} 
                alt={vendor.businessName}
                className="img-fluid rounded"
                style={{ maxWidth: '150px' }}
              />
            </Col>
            <Col md={9}>
              <h1>{vendor.businessName}</h1>
              <div className="mb-2">
                {[...Array(5)].map((_, index) => (
                  <i 
                    key={index}
                    className={`bi ${index < Math.round(vendor.rating) ? 'bi-star-fill' : 'bi-star'}`}
                    style={{ color: '#ffc107' }}
                  ></i>
                ))}
                <span className="ms-1">({vendor.totalReviews} değerlendirme)</span>
              </div>
              <div className="mb-2">
                {vendor.categories.map((category, index) => (
                  <Badge key={index} bg="secondary" className="me-1">
                    {category}
                  </Badge>
                ))}
              </div>
              <p className="text-muted">
                <i className="bi bi-geo-alt-fill me-1"></i>
                {vendor.address.street}, {vendor.address.city}, {vendor.address.state}
              </p>
              <p>
                <i className="bi bi-telephone-fill me-1"></i>
                {vendor.phoneNumber}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Tab.Container id="vendor-details-tabs" defaultActiveKey="menu">
        <Card className="shadow-sm">
          <Card.Header>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="menu">Menü</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="availability">Müsaitlik</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="info">Bilgiler</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey="menu">
                {menuItems.length === 0 ? (
                  <Alert variant="info">
                    Bu restoran için menü bilgisi bulunamadı.
                  </Alert>
                ) : (
                  <>
                    {Object.keys(menuByCategories).map(category => (
                      <div key={category} className="mb-4">
                        <h4 className="mb-3">{category}</h4>
                        <Row>
                          {menuByCategories[category].map(item => (
                            <Col key={item._id} md={6} className="mb-3">
                              <Card className="h-100">
                                <Row className="g-0">
                                  <Col xs={4}>
                                    <img
                                      src={item.image !== 'default-food.jpg' ? item.image : 'https://via.placeholder.com/150?text=Yemek'}
                                      alt={item.name}
                                      className="img-fluid rounded-start"
                                      style={{ height: '100%', objectFit: 'cover' }}
                                    />
                                  </Col>
                                  <Col xs={8}>
                                    <Card.Body>
                                      <div className="d-flex justify-content-between align-items-start">
                                        <Card.Title>{item.name}</Card.Title>
                                        <h5 className="text-primary">{item.price.toFixed(2)} ₺</h5>
                                      </div>
                                      <Card.Text className="mb-2" style={{ fontSize: '0.9rem' }}>
                                        {item.description.length > 80
                                          ? `${item.description.substring(0, 80)}...`
                                          : item.description}
                                      </Card.Text>
                                      <div className="d-flex justify-content-between">
                                        <div>
                                          {item.isVegetarian && (
                                            <Badge bg="success" className="me-1">Vejetaryen</Badge>
                                          )}
                                          {item.isVegan && (
                                            <Badge bg="success" className="me-1">Vegan</Badge>
                                          )}
                                          {item.isGlutenFree && (
                                            <Badge bg="warning" text="dark" className="me-1">Glutensiz</Badge>
                                          )}
                                          {item.spicyLevel > 0 && (
                                            <Badge bg="danger">
                                              {[...Array(item.spicyLevel)].map((_, i) => (
                                                <i key={i} className="bi bi-fire"></i>
                                              ))}
                                            </Badge>
                                          )}
                                        </div>
                                        <Button 
                                          variant="outline-primary" 
                                          size="sm"
                                          onClick={() => quickAddToCart(item)}
                                        >
                                          <i className="bi bi-cart-plus"></i> Sepete Ekle
                                        </Button>
                                      </div>
                                    </Card.Body>
                                  </Col>
                                </Row>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ))}
                  </>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="availability">
                <h3 className="mb-3">Çalışma Saatleri ve Randevu</h3>
                <p className="mb-4">
                  Aşağıdaki tabloda restoranın çalışma saatlerini görebilir ve randevu alabilirsiniz.
                  Bugün <strong>{currentDay}</strong> ({formatDate(today)})
                </p>
                
                {availability.length === 0 ? (
                  <Alert variant="info">
                    Bu restoran için müsaitlik bilgisi bulunamadı.
                  </Alert>
                ) : (
                  <Table bordered responsive>
                    <thead className="bg-light">
                      <tr>
                        <th>Gün</th>
                        <th>Durum</th>
                        <th>Çalışma Saatleri</th>
                        <th>Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availability.map((day, index) => (
                        <tr 
                          key={index} 
                          className={day.day === currentDay ? 'table-primary' : ''}
                        >
                          <td>{day.day}</td>
                          <td>
                            {day.isOpen ? (
                              <Badge bg="success">Açık</Badge>
                            ) : (
                              <Badge bg="danger">Kapalı</Badge>
                            )}
                          </td>
                          <td>
                            {day.isOpen ? (
                              `${day.openTime} - ${day.closeTime}`
                            ) : (
                              'Kapalı'
                            )}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              disabled={!day.isOpen}
                              onClick={() => openReservationModal(day.day)}
                            >
                              Randevu Al
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="info">
                <Row>
                  <Col md={8}>
                    <h4 className="mb-3">Restoran Hakkında</h4>
                    <p>{vendor.description}</p>
                    
                    <h5 className="mt-4 mb-3">İletişim Bilgileri</h5>
                    <p><strong>Adres:</strong> {vendor.address.street}, {vendor.address.city}, {vendor.address.state}, {vendor.address.zipCode}</p>
                    <p><strong>Telefon:</strong> {vendor.phoneNumber}</p>
                    {vendor.email && <p><strong>E-posta:</strong> {vendor.email}</p>}
                    {vendor.website && <p><strong>Web Sitesi:</strong> <a href={vendor.website} target="_blank" rel="noreferrer">{vendor.website}</a></p>}
                    
                    {vendor.socialMedia && (
                      <div className="mt-3">
                        {vendor.socialMedia.facebook && (
                          <a href={vendor.socialMedia.facebook} target="_blank" rel="noreferrer" className="me-2">
                            <i className="bi bi-facebook fs-4"></i>
                          </a>
                        )}
                        {vendor.socialMedia.instagram && (
                          <a href={vendor.socialMedia.instagram} target="_blank" rel="noreferrer" className="me-2">
                            <i className="bi bi-instagram fs-4"></i>
                          </a>
                        )}
                        {vendor.socialMedia.twitter && (
                          <a href={vendor.socialMedia.twitter} target="_blank" rel="noreferrer" className="me-2">
                            <i className="bi bi-twitter fs-4"></i>
                          </a>
                        )}
                      </div>
                    )}
                  </Col>
                  <Col md={4}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Bilgiler</h5>
                        <p><strong>Mutfak:</strong> {vendor.cuisine}</p>
                        <p><strong>Minimum Sipariş:</strong> {vendor.minOrderAmount > 0 ? `${vendor.minOrderAmount} ₺` : 'Yok'}</p>
                        <p><strong>Teslimat Ücreti:</strong> {vendor.deliveryFee > 0 ? `${vendor.deliveryFee} ₺` : 'Ücretsiz'}</p>
                        <p><strong>Tahmini Teslimat:</strong> {vendor.estimatedDeliveryTime} dakika</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
      
      {/* Rezervasyon Modalı */}
      <Modal show={showReservationModal} onHide={() => setShowReservationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Randevu Oluştur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reservationSuccess ? (
            <Alert variant="success">
              Randevunuz başarıyla oluşturuldu! Teşekkür ederiz.
            </Alert>
          ) : (
            <>
              {selectedDay && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Randevu Günü</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedDay.day} 
                      readOnly 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Saat</Form.Label>
                    <Form.Select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      required
                    >
                      <option value="">Saat Seçin</option>
                      {availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Not (İsteğe Bağlı)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Özel isteklerinizi buraya yazabilirsiniz"
                    />
                  </Form.Group>
                  
                  {reservationError && (
                    <Alert variant="danger">{reservationError}</Alert>
                  )}
                </Form>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!reservationSuccess && (
            <>
              <Button variant="secondary" onClick={() => setShowReservationModal(false)}>
                İptal
              </Button>
              <Button 
                variant="primary" 
                onClick={makeReservation}
                disabled={reservationLoading}
              >
                {reservationLoading ? 'İşleniyor...' : 'Randevu Oluştur'}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      
      {/* Sepete Ürün Ekleme Modalı */}
      <Modal show={showCartModal} onHide={closeAddToCartModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sepete Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div className="d-flex flex-column">
              <div className="d-flex mb-3">
                <div className="me-3">
                  <img 
                    src={selectedItem.image || "https://via.placeholder.com/80"} 
                    alt={selectedItem.name} 
                    style={{ width: "80px", height: "80px", objectFit: "cover" }} 
                    className="rounded"
                  />
                </div>
                <div>
                  <h5>{selectedItem.name}</h5>
                  <p className="text-muted mb-1">{selectedItem.description}</p>
                  <p className="fw-bold">₺{selectedItem.price.toFixed(2)}</p>
                </div>
              </div>
              
              {cartSuccess.show ? (
                <Alert variant="success" className="text-center">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <strong>{cartSuccess.item?.name}</strong> sepete eklendi!
                </Alert>
              ) : (
                <>
                  {cartError && <Alert variant="danger">{cartError}</Alert>}
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Miktar</Form.Label>
                    <div className="d-flex align-items-center">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <i className="bi bi-dash"></i>
                      </Button>
                      <Form.Control
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="mx-2 text-center"
                      />
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <i className="bi bi-plus"></i>
                      </Button>
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Özel İstekler (İsteğe Bağlı)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Ekstra malzeme, pişirme tercihi vb."
                    />
                  </Form.Group>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!cartSuccess.show && (
            <>
              <Button variant="outline-secondary" onClick={closeAddToCartModal}>
                İptal
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ekleniyor...
                  </>
                ) : (
                  'Sepete Ekle'
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendorDetailPage; 