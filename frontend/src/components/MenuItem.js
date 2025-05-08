import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Badge, Toast } from 'react-bootstrap';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../App';
import axios from 'axios';

const MenuItem = ({ item }) => {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(null); // null = kontrol edilmedi, true/false = sonuç
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000/api';

  // Component mount edildiğinde token kontrolü yap
  useEffect(() => {
    // Komponent yüklendiğinde sessiz bir kontrol yapalım
    const checkAuth = async () => {
      try {
        const result = await checkUserAuthentication(true); // silent = true
        setIsUserAuthenticated(result.isAuthenticated);
      } catch (error) {
        console.error('Kimlik doğrulama kontrolü sırasında hata:', error);
        setIsUserAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Token geçerliliğini kontrol et - geliştirilmiş güvenlik kontrolü
  const isTokenValid = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    try {
      // JWT'nin basit yapısal kontrolü
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Geçersiz token yapısı: 3 parça bekleniyordu');
        return false;
      }
      
      // Base64 payload kısmını decode et ve JSON'a dönüştür
      let payload;
      try {
        payload = JSON.parse(atob(tokenParts[1]));
      } catch (e) {
        console.error('Token payload kısmı decode edilemedi', e);
        return false;
      }
      
      // Token süre kontrolü
      if (!payload || !payload.exp) {
        console.error('Token yapısı hatalı: exp değeri bulunamadı');
        return false;
      }
      
      const expirationTime = payload.exp * 1000; // saniyeden milisaniyeye çevir
      const currentTime = Date.now();
      const timeRemaining = expirationTime - currentTime;
      const isValid = timeRemaining > 0;
      
      if (!isValid) {
        console.log('Token süresi dolmuş', {
          expires: new Date(expirationTime).toLocaleString(),
          now: new Date(currentTime).toLocaleString(),
          timeRemaining: `${Math.floor(timeRemaining / 1000 / 60)} dakika kaldı`
        });
      } else if (timeRemaining < 15 * 60 * 1000) { // 15 dakikadan az kaldıysa uyar
        console.warn('Token süresi yakında dolacak', {
          expires: new Date(expirationTime).toLocaleString(),
          now: new Date(currentTime).toLocaleString(),
          timeRemaining: `${Math.floor(timeRemaining / 1000 / 60)} dakika kaldı`
        });
      }
      
      return isValid;
    } catch (error) {
      console.error('Token kontrolü sırasında hata oluştu:', error);
      return false;
    }
  };

  // Kullanıcı kimlik doğrulaması kontrolü - optimize edildi
  const checkUserAuthentication = async (silent = false) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { 
          isAuthenticated: false, 
          message: silent ? null : 'Oturum açmanız gerekiyor. Sepete ürün eklemek için lütfen giriş yapın.' 
        };
      }
      
      if (!isTokenValid()) {
        // Token geçersiz veya süresi dolmuş - oturum bilgilerini temizle
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        return { 
          isAuthenticated: false, 
          message: silent ? null : 'Oturumunuzun süresi dolmuş, lütfen tekrar giriş yapın.' 
        };
      }
      
      // Kullanıcı bilgisini kontrol et
      const userInfoStr = localStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        // Kullanıcı bilgisi yoksa, token olsa bile kullanıcı bilgisini sunucudan al
        try {
          const response = await axios.get(`${API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data && response.status === 200) {
            localStorage.setItem('userInfo', JSON.stringify(response.data));
            return { isAuthenticated: true };
          } else {
            console.error('Kullanıcı bilgisi alınamadı:', response);
            return { 
              isAuthenticated: false, 
              message: silent ? null : 'Kullanıcı bilgisi alınamadı, lütfen tekrar giriş yapın' 
            };
          }
        } catch (error) {
          console.error('Kullanıcı bilgisi alma hatası:', error);
          
          if (error.response && error.response.status === 401) {
            // Yetkilendirme hatası - oturum bilgilerini temizle
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
          }
          
          return { 
            isAuthenticated: false, 
            message: silent ? null : 'Oturum bilgileriniz geçersiz, lütfen tekrar giriş yapın' 
          };
        }
      }
      
      // userInfo doğru şekilde parse edilebiliyor mu kontrol et
      try {
        const userInfo = JSON.parse(userInfoStr);
        if (!userInfo || !userInfo._id) {
          console.error('Kullanıcı bilgisi geçersiz veya eksik');
          
          if (!silent) {
            localStorage.removeItem('userInfo');
          }
          
          return { 
            isAuthenticated: false, 
            message: silent ? null : 'Oturum bilgilerinizde hata oluştu, lütfen tekrar giriş yapın' 
          };
        }
        return { isAuthenticated: true };
      } catch (e) {
        console.error('Kullanıcı bilgisi JSON formatında değil:', e);
        
        if (!silent) {
          localStorage.removeItem('userInfo');
        }
        
        return { 
          isAuthenticated: false, 
          message: silent ? null : 'Oturum bilgilerinizde hata oluştu, lütfen tekrar giriş yapın' 
        };
      }
    } catch (error) {
      console.error('Kimlik doğrulama sırasında beklenmeyen hata:', error);
      return { 
        isAuthenticated: false, 
        message: silent ? null : 'Bir hata oluştu, lütfen sayfayı yenileyip tekrar deneyin' 
      };
    }
  };

  // Kullanıcıya bildirim göster
  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    
    // 3 saniye sonra toast'ı kapat
    setTimeout(() => setShowToast(false), 3000);
  };

  // Ağ hataları için yardımcı fonksiyon
  const handleApiError = (error, defaultMsg = 'Sunucu hatası oluştu') => {
    console.error('API hatası:', error);
    
    let errorMessage = defaultMsg;
    
    if (error.response) {
      // Sunucudan yanıt geldi ve hata içeriyor
      if (error.response.status === 401) {
        // Token geçersiz
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setIsUserAuthenticated(false);
        errorMessage = 'Oturumunuz sona ermiş, lütfen tekrar giriş yapın';
        
        setTimeout(() => {
          navigate('/login', { state: { redirectTo: window.location.pathname } });
        }, 2000);
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Geçersiz istek, lütfen tekrar deneyin';
      } else if (error.response.status === 404) {
        errorMessage = 'İstenilen kaynak bulunamadı';
      } else if (error.response.status === 429) {
        errorMessage = 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin';
      } else if (error.response.status >= 500) {
        errorMessage = 'Sunucu hatası, lütfen daha sonra tekrar deneyin';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      // İstek yapıldı ama cevap alınamadı
      errorMessage = 'Sunucuya ulaşılamıyor, lütfen internet bağlantınızı kontrol edin';
    }
    
    return errorMessage;
  };

  const handleAddToCart = async () => {
    // Daha önce kontrol edilmiş ise hemen kullan
    if (isUserAuthenticated === false) {
      showNotification('Sepete ürün eklemek için giriş yapmalısınız', 'warning');
      setTimeout(() => {
        navigate('/login', { state: { redirectTo: window.location.pathname } });
      }, 2000);
      return;
    }
    
    setLoading(true);
    
    try {
      // Kullanıcı kimlik doğrulaması kontrolü (eğer daha önce kontrol edilmediyse)
      let authCheck = { isAuthenticated: isUserAuthenticated };
      
      if (isUserAuthenticated === null) {
        authCheck = await checkUserAuthentication();
        setIsUserAuthenticated(authCheck.isAuthenticated); // State'i güncelle
      }
      
      if (!authCheck.isAuthenticated) {
        showNotification(authCheck.message || 'Sepete ürün eklemek için giriş yapmalısınız', 'warning');
        
        // Yönlendirmeden önce kullanıcıya bildirimi görme şansı ver
        setTimeout(() => {
          navigate('/login', { state: { redirectTo: window.location.pathname } });
        }, 2000);
        return;
      }
      
      // Sepete ekleme işlemi
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('Oturum bilgileriniz bulunamadı, lütfen tekrar giriş yapın', 'warning');
        setIsUserAuthenticated(false);
        setTimeout(() => {
          navigate('/login', { state: { redirectTo: window.location.pathname } });
        }, 2000);
        return;
      }
      
      // Kullanıcı ID'sini userInfo'dan al
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo._id) {
        showNotification('Kullanıcı bilgileriniz hatalı, lütfen tekrar giriş yapın', 'warning');
        localStorage.removeItem('userInfo');
        setIsUserAuthenticated(false);
        setTimeout(() => {
          navigate('/login', { state: { redirectTo: window.location.pathname } });
        }, 2000);
        return;
      }
      
      // Context ile geçici sepete ekle (önce yerel olarak göster)
      const success = addToCart(item);
      
      if (!success) {
        showNotification('Ürün sepete eklenemedi', 'danger');
        return;
      }
      
      // Yerel ekleme başarılı ise bildirim göster, API isteği beklerken kullanıcı deneyimini iyileştir
      showNotification(`${item.name} sepete ekleniyor...`, 'info');
      
      // API üzerinden sepeti güncelle
      try {
        // Kaç kez yeniden deneneceği
        const maxRetries = 2;
        let retryCount = 0;
        let apiSuccess = false;
        
        while (!apiSuccess && retryCount <= maxRetries) {
          try {
            const response = await axios.post(
              `${API_BASE_URL}/cart/add`,
              { 
                menuItemId: item._id, 
                quantity: 1,
                userId: userInfo._id  // Backend'in userID'yi alabilmesi için ekstra güvenlik
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                timeout: 10000 // 10 saniye timeout süresi
              }
            );
            
            if (response.data && response.status === 200) {
              apiSuccess = true;
              showNotification(`${item.name} sepete eklendi`, 'success');
              console.log('Sepet başarıyla güncellendi:', response.data);
            } else {
              console.warn('API beklenmeyen cevap döndü:', response);
              throw new Error('Geçersiz API yanıtı');
            }
          } catch (retryError) {
            // Network hataları veya timeout için yeniden dene
            if (retryError.code === 'ECONNABORTED' || !retryError.response) {
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Ağ hatası, yeniden deneniyor (${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
              } else {
                throw retryError; // Tüm denemeler başarısız oldu
              }
            } else {
              // Diğer hataları hemen fırlat (401, 400, vb.)
              throw retryError;
            }
          }
        }
      } catch (apiError) {
        const errorMessage = handleApiError(apiError, 'Sepet güncellenirken bir hata oluştu');
        showNotification(errorMessage, 'danger');
        
        // API hatası olsa bile yerel sepetteki ürünü tutmaya çalış
        console.log('API ile sepet güncellenemedi, ancak yerel sepet güncellendi');
      }
    } catch (error) {
      console.error('Sepete ekleme işlemi sırasında beklenmeyen hata:', error);
      showNotification('İşlem sırasında bir hata oluştu, lütfen tekrar deneyin', 'danger');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card className="menu-item h-100 shadow-sm">
        <div className="menu-item-image-container position-relative">
          {item.imgUrl && (
            <Card.Img
              variant="top"
              src={item.imgUrl}
              alt={item.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=Görüntü+Yüklenemedi';
                e.target.onerror = null;
              }}
              className="menu-item-image"
            />
          )}
          {!item.imgUrl && (
            <Card.Img
              variant="top"
              src="https://via.placeholder.com/300x200?text=Görüntü+Bulunamadı"
              alt="Ürün görseli bulunamadı"
              className="menu-item-image"
            />
          )}
          {item.isVegetarian && (
            <Badge 
              pill 
              bg="success" 
              className="position-absolute top-0 end-0 m-2"
            >
              Vejetaryen
            </Badge>
          )}
        </div>
        
        <Card.Body className="d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="h5 mb-0 text-truncate">{item.name}</Card.Title>
            <span className="badge bg-primary rounded-pill">{item.price.toFixed(2)} ₺</span>
          </div>
          
          <Card.Text className="text-muted mb-2 small">
            {item.description}
          </Card.Text>
          
          {item.allergens && item.allergens.length > 0 && (
            <div className="mb-2">
              <small className="text-danger">
                <strong>Alerjenler:</strong> {item.allergens.join(', ')}
              </small>
            </div>
          )}
          
          {item.calories && (
            <div className="mb-2">
              <small className="text-muted">
                <strong>Kalori:</strong> {item.calories} kcal
              </small>
            </div>
          )}
          
          <div className="mt-auto pt-2">
            <Button
              variant={isUserAuthenticated === false ? "warning" : "outline-primary"}
              className="w-100 d-flex align-items-center justify-content-center"
              onClick={isUserAuthenticated === false ? () => navigate('/login', { state: { redirectTo: window.location.pathname } }) : handleAddToCart}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <FaShoppingCart className="me-2" />
              )}
              {loading ? 'Ekleniyor...' : (isUserAuthenticated === false ? 'Giriş Yapın' : 'Sepete Ekle')}
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      {/* Bildirim Toast */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} bg={toastVariant} delay={3000} autohide>
          <Toast.Header closeButton>
            <strong className="me-auto">Sepet Bildirimi</strong>
          </Toast.Header>
          <Toast.Body className={toastVariant === 'danger' || toastVariant === 'dark' ? 'text-white' : ''}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </div>
    </>
  );
};

export default MenuItem; 