import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge, Image } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // localStorage'dan kullanıcı bilgilerini al ve sayfa değiştiğinde güncelle
  useEffect(() => {
    const checkUserInfo = () => {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const userInfo = JSON.parse(storedUserInfo);
          console.log('Header loaded user info:', userInfo);
          
          // Kullanıcı bilgilerinde eksik alanları tamamla
          const updatedUserInfo = {
            ...userInfo,
            name: userInfo.name || (userInfo.email ? userInfo.email.split('@')[0] : 'Kullanıcı'),
            email: userInfo.email || '',
            role: userInfo.role || 'user'
          };
          
          // Bilgilerde güncelleme yapıldıysa localStorage'ı güncelle
          if (updatedUserInfo.name !== userInfo.name || 
              updatedUserInfo.email !== userInfo.email ||
              updatedUserInfo.role !== userInfo.role) {
            console.log('Header: Kullanıcı bilgileri güncellendi', updatedUserInfo);
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          }
          
          // Ayşe Teyze için rol düzeltmesi
          if (updatedUserInfo.email?.toLowerCase() === 'ayseteyze@test.com' && updatedUserInfo.role !== 'vendor') {
            console.log('Header bileşeninde Ayşe Teyze için rol düzeltiliyor -> vendor');
            updatedUserInfo.role = 'vendor';
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          }
          
          setUserInfo(updatedUserInfo);
          
          // Giriş yapıldıysa sepeti kontrol et
          if (updatedUserInfo) {
            // Artık fetchCartItems yerine loadCart fonksiyonu useEffect içinde kullanılacak
          }
        } catch (error) {
          console.error('Header: userInfo parse hatası', error);
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
    };

    // Sayfa yüklendiğinde veya sayfa değiştiğinde kullanıcı bilgilerini güncelle
    checkUserInfo();

    // localStorage dinleyicisi
    const handleStorageChange = () => {
      checkUserInfo();
    };

    // Storage olayını dinle
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]); // Sayfa değiştiğinde tekrar çalıştır
  
  // Sepet simgesi ve sepet öğelerini al
  useEffect(() => {
    // Sepet öğelerini yükle
    const loadCart = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Kullanıcı giriş yapmışsa normal API çağrısı yap
        if (token) {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.get('http://localhost:5000/api/cart', config);
          
          if (response.data.success) {
            setCartItems(response.data.data.items || []);
            setCartItemCount(response.data.data.items?.length || 0);
          }
        } else {
          // Kullanıcı giriş yapmamışsa geçici sepeti kullan
          const tempCart = localStorage.getItem('tempCart');
          console.log('Header tempCart kontrol:', tempCart);
          
          if (tempCart) {
            const parsedCart = JSON.parse(tempCart);
            console.log('Header parsed tempCart:', parsedCart);
            setCartItems(parsedCart.items || []);
            setCartItemCount(parsedCart.items?.length || 0);
          } else {
            setCartItems([]);
            setCartItemCount(0);
          }
        }
      } catch (error) {
        console.error('Sepet bilgileri yüklenirken hata', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
    
    // Özel bir olay dinleyicisi oluşturalım
    const handleStorageChange = (e) => {
      console.log('Storage değişikliği algılandı:', e);
      loadCart();
    };
    
    // window storage event'i dinle (login/logout durumlarında tetiklenir)
    window.addEventListener('storage', handleStorageChange);
    
    // Özel storage olayını da dinle
    document.addEventListener('cartUpdated', loadCart);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('cartUpdated', loadCart);
    };
  }, []);

  const handleLogout = () => {
    // Kullanıcı bilgilerini localStorage'dan temizle
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUserInfo(null);
    setCartItems([]);
    setCartItemCount(0);
    navigate('/login');
  };

  // Avatar URL oluştur
  const getAvatarUrl = () => {
    if (!userInfo) return "https://ui-avatars.com/api/?name=User&background=random";
    
    const name = userInfo.name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  return (
    <header>
      <Navbar bg="primary" variant="dark" expand="lg" className="py-2">
        <Container>
          <Navbar.Brand as={Link} to="/">Yemek Rezervasyon</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/vendors" className="me-2">
                <i className="bi bi-shop"></i> Restoranlar
              </Nav.Link>
              
              {userInfo && userInfo.role === 'vendor' && (
                <Nav.Link as={Link} to="/vendor/orders" className="me-2">
                  <i className="bi bi-list-check"></i> Gelen Siparişler
                </Nav.Link>
              )}
              
              {/* Admin paneli bağlantısı */}
              {userInfo && userInfo.role === 'admin' && (
                <Nav.Link as={Link} to="/admin" className="me-2">
                  <i className="bi bi-gear-fill"></i> Admin Paneli
                </Nav.Link>
              )}
              
              {/* Her kullanıcı için sepeti göster */}
              <Nav.Link as={Link} to="/cart" className="position-relative me-2">
                <i className="bi bi-cart"></i> Sepet
                {cartItemCount > 0 && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute top-0 start-100 translate-middle"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Nav.Link>
              
              {userInfo ? (
                <>
                  {userInfo.role === 'user' && (
                    <>
                      {/* Siparişler Linki */}
                      <Nav.Link as={Link} to="/orders" className="me-2">
                        <i className="bi bi-box"></i> Siparişlerim
                      </Nav.Link>
                    </>
                  )}
                  
                  {userInfo.role === 'vendor' && (
                    <>
                      <Nav.Link as={Link} to="/vendor/dashboard" className="me-2">
                        <i className="bi bi-speedometer2"></i> Kontrol Paneli
                      </Nav.Link>
                      <Nav.Link as={Link} to="/vendor/menu" className="me-2">
                        <i className="bi bi-card-list"></i> Menü
                      </Nav.Link>
                    </>
                  )}
                  
                  {/* Profil Dropdown */}
                  <NavDropdown 
                    title={
                      <span>
                        <i className="bi bi-person-circle me-1"></i>
                        {userInfo.name}
                      </span>
                    } 
                    id="username"
                  >
                    {userInfo.role === 'admin' && (
                      <NavDropdown.Item as={Link} to="/admin">
                        <i className="bi bi-gear-fill me-2"></i>
                        Admin Paneli
                      </NavDropdown.Item>
                    )}
                    
                    {userInfo.role === 'vendor' && (
                      <NavDropdown.Item as={Link} to="/vendor/dashboard">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Satıcı Paneli
                    </NavDropdown.Item>
                    )}
                    
                    <NavDropdown.Item as={Link} to="/profile">
                      <i className="bi bi-person me-2"></i>
                      Profilim
                    </NavDropdown.Item>
                    
                    {userInfo.role === 'vendor' && (
                      <NavDropdown.Item as={Link} to="/vendor/profile/edit">
                        <i className="bi bi-shop me-2"></i>
                        İşletme Profilim
                        </NavDropdown.Item>
                    )}
                    
                    <NavDropdown.Item as={Link} to="/orders">
                      <i className="bi bi-bag-check me-2"></i>
                      Siparişlerim
                    </NavDropdown.Item>
                    
                    <NavDropdown.Divider />
                    
                    <NavDropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Çıkış Yap
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login" className="me-2">Giriş Yap</Nav.Link>
                  <Nav.Link as={Link} to="/register">Kayıt Ol</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header; 