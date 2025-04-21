import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // localStorage'dan kullanıcı bilgilerini al
        const storedUserInfo = localStorage.getItem('userInfo');
        if (!storedUserInfo) {
          // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
          navigate('/login');
          return;
        }

        try {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          console.log('HomePage loaded user info:', parsedUserInfo);
          
          // Eksik alan kontrolü ve rol alanının doğruluğundan emin olma
          let updatedUserInfo = {
            ...parsedUserInfo,
            name: parsedUserInfo.name || parsedUserInfo.email?.split('@')[0] || 'Kullanıcı',
            email: parsedUserInfo.email || '',
            role: parsedUserInfo.role || 'user'
          };
          
          // Ayşe Teyze için özel rol düzeltmesi
          if (updatedUserInfo.email?.toLowerCase() === 'ayseteyze@test.com') {
            console.log('Ana sayfada Ayşe Teyze kullanıcısı için rol düzeltiliyor -> vendor');
            updatedUserInfo.role = 'vendor';
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          }
          
          // Eğer bilgilerde eksik varsa localStorage'ı güncelle
          if (updatedUserInfo.name !== parsedUserInfo.name || 
              updatedUserInfo.email !== parsedUserInfo.email ||
              updatedUserInfo.role !== parsedUserInfo.role) {
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            console.log('Updated user info in HomePage:', updatedUserInfo);
          }
          
          setUserInfo(updatedUserInfo);

          // Token varsa kullanıcı bilgilerini API'den doğrula
          const token = localStorage.getItem('token');
          if (token) {
            const config = {
              headers: {
                Authorization: `Bearer ${token}`
              }
            };
            
            try {
              // Kullanıcı bilgilerini doğrulamak için profil isteği gönder
              const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', config);
              console.log('Profile response:', profileResponse.data);
              
              // Kullanıcı rolünü backendden gelen ile senkronize et
              if (profileResponse.data && profileResponse.data.role) {
                // Eğer rol değişmişse güncelle
                if (updatedUserInfo.role !== profileResponse.data.role) {
                  console.log('Role mismatch! Local:', updatedUserInfo.role, 'Server:', profileResponse.data.role);
                  updatedUserInfo.role = profileResponse.data.role;
                  localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                  setUserInfo(updatedUserInfo);
                }
              }
  
              // Kullanıcı rolüne göre ek bilgileri getir
              if (updatedUserInfo.role === 'vendor') {
                try {
                  const vendorResponse = await axios.get('http://localhost:5000/api/vendors/profile', config);
                  console.log('Vendor profile response:', vendorResponse.data);
                  
                  if (vendorResponse.data.success) {
                    // Backend'den gelen güncel kullanıcı bilgileri ile localStorage'ı güncelle
                    const vendorUpdatedUserInfo = {
                      ...updatedUserInfo,
                      vendorProfile: vendorResponse.data.data
                    };
                    localStorage.setItem('userInfo', JSON.stringify(vendorUpdatedUserInfo));
                    setUserInfo(vendorUpdatedUserInfo);
                  }
                } catch (err) {
                  console.log('Vendor profili getirilemedi:', err);
                }
              }
            } catch (profileErr) {
              console.error('Profil bilgileri getirilemedi:', profileErr);
            }
          }
        } catch (parseError) {
          console.error('Error parsing user info from localStorage', parseError);
          localStorage.removeItem('userInfo');
          navigate('/login');
          return;
        }
      } catch (error) {
        setError('Kullanıcı bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleLogout = () => {
    // Kullanıcı bilgilerini localStorage'dan temizle
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUserInfo(null);
    navigate('/login');
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

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!userInfo) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.
        </Alert>
        <Button 
          variant="primary"
          onClick={() => navigate('/login')}
          className="mt-3"
        >
          Giriş Sayfasına Git
        </Button>
      </Container>
    );
  }

  // Kullanıcı rolüne göre görüntülenecek içeriği belirle
  const getRoleDisplay = (role) => {
    console.log('Displaying role:', role, 'Type:', typeof role);
    
    // Eğer role string değilse veya boş ise
    if (!role) {
      return 'Kullanıcı';
    }
    
    // Rol değerini kontrol et - küçük/büyük harf duyarlılığını kaldırarak
    const roleLowerCase = String(role).toLowerCase().trim();
    console.log('Normalized role:', roleLowerCase);
    
    switch (roleLowerCase) {
      case 'admin':
        return 'Yönetici';
      case 'vendor':
        return 'Restoran Sahibi';
      case 'user':
        return 'Kullanıcı';
      default:
        console.log('Unknown role type:', roleLowerCase);
        return 'Kullanıcı'; // Beklenmeyen değerler için default
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1>Hoş Geldiniz, {userInfo.name || userInfo.email?.split('@')[0] || 'Kullanıcı'}!</h1>
          <p>Yemek Rezervasyon Uygulamasına başarıyla giriş yaptınız.</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Kullanıcı Bilgileri</Card.Title>
              <hr />
              <p><strong>Ad Soyad:</strong> {userInfo.name || userInfo.email?.split('@')[0] || 'Belirtilmemiş'}</p>
              <p><strong>E-posta:</strong> {userInfo.email || 'Belirtilmemiş'}</p>
              <p><strong>Rol:</strong> {getRoleDisplay(userInfo.role)}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Kontrol Paneli</Card.Title>
              <hr />
              
              {userInfo.role === 'vendor' ? (
                <>
                  <p>
                    <strong>Restoran Sahibi</strong> olarak aşağıdaki işlemleri yapabilirsiniz:
                  </p>
                  <div className="d-grid gap-2 mb-4">
                    <Link to="/vendor/dashboard">
                      <Button variant="primary" className="w-100 mb-2">
                        Satıcı Kontrol Paneli
                      </Button>
                    </Link>
                    <Link to="/vendor/menu">
                      <Button variant="outline-primary" className="w-100 mb-2">
                        Menü Yönetimi
                      </Button>
                    </Link>
                    <Link to="/vendor/availability">
                      <Button variant="outline-primary" className="w-100">
                        Müsaitlik Ayarları
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p>Bu uygulama şu anda minimalist bir yapıda olup, sadece kullanıcı girişi ve kayıt özellikleri içermektedir.</p>
                  <p>Uygulamanın tam sürümü geliştirilme aşamasındadır.</p>
                </>
              )}
              
              <div className="mt-4">
                <Button 
                  variant="danger"
                  onClick={handleLogout}
                  className="me-2"
                >
                  Çıkış Yap
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage; 