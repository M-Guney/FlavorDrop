import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Alert, InputGroup, FormControl, Modal, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CartPage.css';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaTruck, FaMoneyBillWave } from 'react-icons/fa';
import { BiCheckCircle } from 'react-icons/bi';
import { CartContext } from '../App';

const CartItemCard = ({ cartItem, handleQuantityChange, handleRemoveItem }) => {
  const { menuItem, quantity } = cartItem;

  // Backend'den gelen veri yapısı ile uyumlu hale getir
  const menuItemData = typeof menuItem === 'string' ? { _id: menuItem, name: cartItem.name || 'Ürün', price: cartItem.price || 0 } : menuItem;
  const itemPrice = parseFloat(menuItemData?.price || 0);
  const totalPrice = itemPrice * (quantity || 1);

  // Varsayılan ürün resmi
  const defaultProductImage = "https://via.placeholder.com/80x80?text=Yemek";

  return (
    <Card className="mb-3 shadow-sm border-0 rounded-3">
      <Card.Body>
        <div className="d-flex">
          <div className="me-3" style={{ width: '80px', height: '80px' }}>
            <img 
              src={menuItemData.image || defaultProductImage} 
              alt={menuItemData.name} 
              className="img-fluid rounded" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="mb-1">{menuItemData.name}</h5>
              <h5 className="text-primary mb-0">₺{totalPrice.toFixed(2)}</h5>
            </div>
            
            <p className="text-muted small mb-3">
              {menuItemData.description?.substring(0, 100)}
              {menuItemData.description?.length > 100 ? '...' : ''}
            </p>
            
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => handleQuantityChange(cartItem, Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <FaMinus />
                </Button>
                <span className="mx-2">{quantity}</span>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => handleQuantityChange(cartItem, quantity + 1)}
                >
                  <FaPlus />
                </Button>
              </div>
              
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => handleRemoveItem(cartItem)}
              >
                <FaTrash className="me-1" /> Kaldır
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CartPage = () => {
  const { cart: contextCart, removeFromCart, clearCart } = useContext(CartContext);
  const [serverCart, setServerCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState(null);
  
  const navigate = useNavigate();
  
  // Backend'den sepet verilerini al
  const fetchCartFromServer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
      
      if (!token || !userInfo) {
        setServerCart(null);
        setLoading(false);
        return;
      }
      
      const userId = userInfo.id || userInfo._id;
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        }
      };
      
      console.log('Sepet verisi çekiliyor, kullanıcı ID:', userId);
      const response = await axios.get('http://localhost:5000/api/cart', config);
      
      if (response.data.success) {
        console.log('Sepet verisi başarıyla alındı:', response.data.data);
        
        // Sepet verilerini backend yapısına göre düzenle
        const cartData = response.data.data;
        
        // Her öğeyi kontrol et ve uygun formata dönüştür
        if (cartData && cartData.items && Array.isArray(cartData.items)) {
          // Fiyat hesaplamalarını burada yap
          const enhancedItems = cartData.items.map(item => {
            // Eğer menuItem bir string (ID) ise ve name ve price alanları varsa
            if (typeof item.menuItem === 'string' && item.name) {
              return {
                ...item,
                menuItem: {
                  _id: item.menuItem,
                  name: item.name,
                  price: parseFloat(item.price) || 0,
                  image: item.image || ''
                }
              };
            }
            return item;
          });
          
          // Toplam tutarı hesapla
          let totalAmount = 0;
          enhancedItems.forEach(item => {
            const price = parseFloat(item.price || (item.menuItem?.price) || 0);
            const quantity = parseInt(item.quantity) || 1;
            totalAmount += price * quantity;
          });
          
          // Güncellenmiş sepet verisini ayarla
          setServerCart({
            ...cartData,
            items: enhancedItems,
            totalAmount: totalAmount
          });
        } else {
          setServerCart(cartData);
        }
      } else {
        setServerCart(null);
      }
    } catch (error) {
      console.error('Sepet verisi alınırken hata:', error);
      setError('Sepet verisi alınırken bir hata oluştu');
      setServerCart(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Bileşen yüklendiğinde ve herhangi bir değişiklik olduğunda sepet verilerini al
    fetchCartFromServer();
    
    // Sepet güncellendiğinde dinle
    const handleCartUpdate = () => {
      console.log('Sepet güncellendi, yeniden yükleniyor...');
      fetchCartFromServer();
    };
    
    // Olay dinleyicileri ekle
    window.addEventListener('storage', handleCartUpdate);
    document.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      // Temizlik
      window.removeEventListener('storage', handleCartUpdate);
      document.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  // Sepet işlemleri
  const handleQuantityChange = async (item, newQuantity) => {
    try {
      // Yeni miktar 0'dan küçükse işlemi iptal et
      if (newQuantity <= 0) return;
      
      setUpdatingItemId(item._id);
      
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
      
      if (token && userInfo) {
        // API üzerinden miktar güncelle
        const config = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userInfo.id || userInfo._id
          }
        };
        
        await axios.put(
          `http://localhost:5000/api/cart/${item._id}`,
          { quantity: newQuantity },
          config
        );
        
        // Sepet verilerini yeniden yükle
        fetchCartFromServer();
      } else {
        // localStorage'dan sepeti al
        const tempCartData = localStorage.getItem('tempCart');
        
        if (tempCartData) {
          const tempCart = JSON.parse(tempCartData);
          
          // Ürünü bul ve miktarını güncelle
          const updatedItems = tempCart.items.map(cartItem => {
            if (cartItem._id === item._id) {
              return { ...cartItem, quantity: newQuantity };
            }
            return cartItem;
          });
          
          tempCart.items = updatedItems;
          
          // Toplam tutarı hesapla
          let totalAmount = 0;
          updatedItems.forEach(item => {
            totalAmount += (parseFloat(item.menuItem.price) || 0) * (parseInt(item.quantity) || 0);
          });
          
          tempCart.totalAmount = totalAmount;
          localStorage.setItem('tempCart', JSON.stringify(tempCart));
          
          // Context güncellemesi
          if (window.fetchCartItems) {
            window.fetchCartItems();
          }
        }
      }
    } catch (error) {
      console.error('Miktar güncellenirken hata:', error);
      setError('Miktar güncellenirken bir hata oluştu');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      setUpdatingItemId(item._id);
      
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
      
      if (token && userInfo) {
        // API üzerinden ürünü kaldır
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userInfo.id || userInfo._id
          }
        };
        
        await axios.delete(`http://localhost:5000/api/cart/${item._id}`, config);
        
        // Sepet verilerini yeniden yükle
        fetchCartFromServer();
      } else {
        // Context üzerinden sepetten ürünü kaldır
        removeFromCart(item._id);
      }
      
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
      setError('Ürün sepetten çıkarılırken bir hata oluştu');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
      
      if (token && userInfo) {
        // API üzerinden sepeti temizle
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userInfo.id || userInfo._id
          }
        };
        
        await axios.delete('http://localhost:5000/api/cart', config);
        
        // Sepet verilerini yeniden yükle
        fetchCartFromServer();
      } else {
        // Context üzerinden sepeti temizle
        clearCart();
      }
      
    } catch (error) {
      console.error('Sepet temizlenirken hata:', error);
      setError('Sepet temizlenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    // Kullanıcı giriş yapmışsa ödeme sayfasına yönlendir
    const token = localStorage.getItem('token');
    
    if (token) {
      navigate('/checkout');
    } else {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      navigate('/login', { state: { redirectTo: '/checkout' } });
    }
  };
  
  // Siparişi oluştur
  const createOrder = async () => {
    // Token kontrolü - en başta yapılmalı
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Token bulunamadı, login sayfasına yönlendiriliyor');
      setErrorMessage('Sipariş vermek için giriş yapmanız gerekmektedir.');
      // Sipariş verme sayfasına geri dönmek için state bilgisini ekle
      setTimeout(() => {
        navigate('/login', { state: { redirectTo: '/cart' } });
      }, 1500);
      return;
    }

    // Teslimat adresi ve telefon kontrolü
    if (!deliveryAddress) {
      setAddressError('Lütfen teslimat adresini giriniz');
      return;
    }
    
    if (!contactPhone) {
      setPhoneError('Lütfen iletişim telefonunu giriniz');
      return;
    }
    
    // Sepet kontrolü - sunucu verisini tercih et
    const activeCart = serverCart || contextCart;
    
    if (!activeCart || !activeCart.items || activeCart.items.length === 0) {
      setErrorMessage('Sepetiniz boş. Lütfen sepetinize ürün ekleyin.');
      return;
    }
    
    // Telefon numarası format kontrolü
    const phoneRegex = /^(\+90|0)?[0-9]{10}$/;  
    if (!phoneRegex.test(contactPhone)) {
      setPhoneError('Geçerli bir telefon numarası giriniz (örn: 05xxxxxxxxx)');
      return;
    }
    
    setAddressError('');
    setPhoneError('');
    setOrderProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userInfo?.id || userInfo?._id
        }
      };
      
      const response = await axios.post(
        'http://localhost:5000/api/orders',
        {
          items: activeCart.items.map(item => ({
            menuItem: item.menuItem._id,
            quantity: item.quantity,
            price: item.menuItem.price
          })),
          paymentMethod,
          deliveryAddress,
          contactPhone,
          userId: userInfo?.id || userInfo?._id
        },
        config
      );
      
      console.log('Sipariş başarıyla oluşturuldu:', response.data);
      
      // Sipariş ID'sini kaydet
      setOrderId(response.data.data._id);
      
      // Sepeti temizle
      await handleClearCart();
      
      // Başarı mesajını göster ve modal'ı aç
      setSuccessMessage('Siparişiniz başarıyla oluşturuldu!');
      setOrderSuccess(true);
      
      // 3 saniye sonra siparişlerim sayfasına yönlendir
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      // Token hatası kontrolü
      if (error.response && error.response.status === 401) {
        setErrorMessage('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        setTimeout(() => {
          // Token geçersiz, kullanıcıyı login sayfasına yönlendir
          localStorage.removeItem('token'); // Token'ı temizle
          navigate('/login', { state: { redirectTo: '/cart' } });
        }, 1500);
      } else {
        setErrorMessage(
          error.response?.data?.error || error.response?.data?.message || 
          'Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        );
      }
    } finally {
      setOrderProcessing(false);
    }
  };
  
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setOrderId(null);
    setSuccessMessage('');
  };
  
  const goToOrders = () => {
    closeSuccessModal();
    navigate('/orders');
  };
  
  const calculateCartTotal = (cart) => {
    if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      return 0;
    }
    
    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.price || (item.menuItem?.price) || 0);
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };
  
  const renderCartItems = () => {
    if (loading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Sepet bilgileri yükleniyor...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="my-3">
          <Alert.Heading>Hata!</Alert.Heading>
          <p>{error}</p>
        </Alert>
      );
    }

    // Öncelikle sunucu sepetini kullan, yoksa context sepetini kullan
    const activeCart = serverCart || contextCart;
    console.log('Aktif sepet:', activeCart);

    if (!activeCart || !activeCart.items || activeCart.items.length === 0) {
      return (
        <div className="text-center my-5 py-5">
          <FaShoppingCart size={64} className="text-muted mb-3" />
          <h3>Sepetiniz Boş</h3>
          <p className="text-muted">Sipariş vermek için menüden ürün ekleyin.</p>
          <Button 
            variant="primary" 
            className="mt-3"
            onClick={() => navigate('/')}
          >
            Menüye Git
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4">
          {activeCart.items.map((cartItem) => (
            <CartItemCard
              key={cartItem._id || (typeof cartItem.menuItem === 'string' ? cartItem.menuItem : cartItem.menuItem?._id)}
              cartItem={cartItem}
              handleQuantityChange={handleQuantityChange}
              handleRemoveItem={handleRemoveItem}
            />
          ))}
        </div>
        
        <div className="d-flex justify-content-between mb-3">
          <Button
            variant="outline-secondary"
            onClick={handleClearCart}
            disabled={loading}
          >
            <FaTrash className="me-1" /> Sepeti Temizle
          </Button>
          
          <Button
            variant="success"
            onClick={() => navigate('/')}
            disabled={loading || orderProcessing}
          >
            <FaShoppingCart className="me-2" /> Menüye Dön
          </Button>
        </div>
      </>
    );
  };
  
  // Siparişi Tamamla bölümünü ekleyeceğim
  // CreateOrder fonksiyonu öncesinde eklenecek form alanları
  const renderOrderForm = () => {
    return (
      <Form className="mt-3">
        <Form.Group className="mb-3">
          <Form.Label>Teslimat Adresi</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Teslimat adresinizi girin"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            isInvalid={!!addressError}
          />
          <Form.Control.Feedback type="invalid">
            {addressError}
          </Form.Control.Feedback>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>İletişim Telefonu</Form.Label>
          <Form.Control
            type="text"
            placeholder="05xxxxxxxxx"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            isInvalid={!!phoneError}
          />
          <Form.Control.Feedback type="invalid">
            {phoneError}
          </Form.Control.Feedback>
          <Form.Text className="text-muted">
            Siparişinizle ilgili sizi bilgilendirmek için kullanılacaktır.
          </Form.Text>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Ödeme Yöntemi</Form.Label>
          <Form.Select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="cash">Kapıda Nakit Ödeme</option>
            <option value="creditCard">Kapıda Kredi Kartı</option>
          </Form.Select>
        </Form.Group>
        
        <div className="d-grid mt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={createOrder}
            disabled={loading || orderProcessing || !activeCart || !activeCart.items || activeCart.items.length === 0}
          >
            {orderProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                İşleniyor...
              </>
            ) : (
              <>Siparişi Tamamla</>
            )}
          </Button>
        </div>
      </Form>
    );
  };
  
  // Yükleme durumu
  if (loading) {
    return (
      <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <h3 className="mt-3">Sepet Yükleniyor...</h3>
        </div>
      </Container>
    );
  }
  
  // Sipariş başarılı olduğunda
  if (orderSuccess) {
    return (
      <Modal 
        show={orderSuccess} 
        onHide={() => setOrderSuccess(false)} 
        centered
        className="success-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Sipariş Başarılı!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
          <h4>Siparişiniz alındı!</h4>
          <p>Sipariş numaranız: <strong>{orderId}</strong></p>
          <p>Siparişiniz hazırlanıyor. Siparişinizin durumunu "Siparişlerim" sayfasından takip edebilirsiniz.</p>
          <Button 
            variant="primary" 
            className="mt-3" 
            onClick={() => navigate('/orders')}
          >
            Siparişlerimi Görüntüle
          </Button>
        </Modal.Body>
      </Modal>
    );
  }
  
  // Öncelikle sunucu sepetini kullan, yoksa context sepetini kullan  
  const activeCart = serverCart || contextCart;
  
  return (
    <Container className="py-5">
      <h2 className="mb-4 d-flex align-items-center">
        <FaShoppingCart className="me-2" /> Alışveriş Sepetim
      </h2>
      
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
          {errorMessage}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm border-0 rounded-3 mb-4">
            <Card.Header className="bg-white py-3">
              <h4 className="mb-0">Alışveriş Sepetim</h4>
              </Card.Header>
            <Card.Body>
              {renderCartItems()}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Header className="bg-white py-3">
              <h4 className="mb-0">Sipariş Özeti</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="d-flex justify-content-between py-3">
                  <span>Ürünler Toplamı</span>
                  <strong>₺{calculateCartTotal(activeCart).toFixed(2)}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between py-3 border-bottom">
                  <span>Teslimat Ücreti</span>
                  <strong>₺0.00</strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between py-3">
                  <h5 className="mb-0">Toplam</h5>
                  <h5 className="text-primary mb-0">₺{calculateCartTotal(activeCart).toFixed(2)}</h5>
                </ListGroup.Item>
              </ListGroup>
              
              {renderOrderForm()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Başarılı Sipariş Modalı */}
      <Modal 
        show={showSuccessModal} 
        onHide={closeSuccessModal}
        centered
        className="success-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Siparişiniz Alındı</Modal.Title>
        </Modal.Header>
        <Modal.Body className="success-modal-body">
          <div className="success-checkmark">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="70">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" stroke="#28a745" strokeWidth="2" />
              <path className="checkmark__check" fill="none" stroke="#28a745" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <div className="success-message">{successMessage}</div>
          {orderId && (
            <div className="order-id">Sipariş No: {orderId}</div>
          )}
          <p>Siparişinizin durumunu "Siparişlerim" sayfasından takip edebilirsiniz.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary" 
            onClick={goToOrders}
            className="view-orders-btn"
          >
            Siparişlerime Git
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CartPage;

/* Sipariş başarılı animasyonu için CSS */
<style jsx>{`
  .success-checkmark {
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }
  .success-checkmark .check-icon {
    width: 80px;
    height: 80px;
    position: relative;
    border-radius: 50%;
    box-sizing: content-box;
    border: 4px solid #4CAF50;
  }
  .success-checkmark .check-icon::before {
    top: 3px;
    left: -2px;
    width: 30px;
    transform-origin: 100% 50%;
    border-radius: 100px 0 0 100px;
  }
  .success-checkmark .check-icon::after {
    top: 0;
    left: 30px;
    width: 60px;
    transform-origin: 0 50%;
    border-radius: 0 100px 100px 0;
    animation: rotate-circle 4.25s ease-in;
  }
  .success-checkmark .check-icon::before, .success-checkmark .check-icon::after {
    content: '';
    height: 100px;
    position: absolute;
    background: #FFFFFF;
    transform: rotate(-45deg);
  }
  .success-checkmark .check-icon .icon-line {
    height: 5px;
    background-color: #4CAF50;
    display: block;
    border-radius: 2px;
    position: absolute;
    z-index: 10;
  }
  .success-checkmark .check-icon .icon-line.line-tip {
    top: 46px;
    left: 14px;
    width: 25px;
    transform: rotate(45deg);
    animation: icon-line-tip 0.75s;
  }
  .success-checkmark .check-icon .icon-line.line-long {
    top: 38px;
    right: 8px;
    width: 47px;
    transform: rotate(-45deg);
    animation: icon-line-long 0.75s;
  }
  .success-checkmark .check-icon .icon-circle {
    top: -4px;
    left: -4px;
    z-index: 10;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    position: absolute;
    box-sizing: content-box;
    border: 4px solid rgba(76, 175, 80, .5);
  }
  .success-checkmark .check-icon .icon-fix {
    top: 8px;
    width: 5px;
    left: 26px;
    z-index: 1;
    height: 85px;
    position: absolute;
    transform: rotate(-45deg);
    background-color: #FFFFFF;
  }
  @keyframes rotate-circle {
    0% {
      transform: rotate(-45deg);
    }
    5% {
      transform: rotate(-45deg);
    }
    12% {
      transform: rotate(-405deg);
    }
    100% {
      transform: rotate(-405deg);
    }
  }
  @keyframes icon-line-tip {
    0% {
      width: 0;
      left: 1px;
      top: 19px;
    }
    54% {
      width: 0;
      left: 1px;
      top: 19px;
    }
    70% {
      width: 50px;
      left: -8px;
      top: 37px;
    }
    84% {
      width: 17px;
      left: 21px;
      top: 48px;
    }
    100% {
      width: 25px;
      left: 14px;
      top: 45px;
    }
  }
  @keyframes icon-line-long {
    0% {
      width: 0;
      right: 46px;
      top: 54px;
    }
    65% {
      width: 0;
      right: 46px;
      top: 54px;
    }
    84% {
      width: 55px;
      right: 0px;
      top: 35px;
    }
    100% {
      width: 47px;
      right: 8px;
      top: 38px;
    }
  }
`}</style> 