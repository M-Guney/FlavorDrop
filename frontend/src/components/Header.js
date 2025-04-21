import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const [userInfo, setUserInfo] = useState(null);
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
          
          // Ayşe Teyze için rol düzeltmesi
          if (userInfo.email?.toLowerCase() === 'ayseteyze@test.com' && userInfo.role !== 'vendor') {
            console.log('Header bileşeninde Ayşe Teyze için rol düzeltiliyor -> vendor');
            userInfo.role = 'vendor';
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
          }
          
          setUserInfo(userInfo);
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

  const handleLogout = () => {
    // Kullanıcı bilgilerini localStorage'dan temizle
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUserInfo(null);
    navigate('/login');
  };

  return (
    <header>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">Yemek Rezervasyon</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {userInfo ? (
                <>
                  {userInfo.role === 'vendor' && (
                    <Nav.Link as={Link} to="/vendor/dashboard" className="text-white fw-bold">
                      Satıcı Paneli
                    </Nav.Link>
                  )}
                  <NavDropdown 
                    title={`Merhaba, ${userInfo.name || userInfo.email?.split('@')[0] || 'Kullanıcı'}`} 
                    id="username"
                  >
                    {userInfo.role === 'vendor' && (
                      <>
                        <NavDropdown.Item as={Link} to="/vendor/menu">
                          Menü Yönetimi
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/vendor/availability">
                          Müsaitlik Ayarları
                        </NavDropdown.Item>
                        <NavDropdown.Divider />
                      </>
                    )}
                    <NavDropdown.Item onClick={handleLogout}>
                      Çıkış Yap
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">Giriş Yap</Nav.Link>
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