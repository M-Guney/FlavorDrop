import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kullanıcı bilgilerini getir
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('userToken');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get('http://localhost:5000/api/users/profile', config);
        
        if (response.data.success) {
          const userData = response.data.data;
          console.log('Profil bilgileri alındı:', userData);
          
          setUserInfo({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || ''
          });
          
          // localStorage'daki bilgileri de güncelle
          const currentUserInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
          const updatedUserInfo = {
            ...currentUserInfo,
            name: userData.name || currentUserInfo.name,
            email: userData.email || currentUserInfo.email,
            phone: userData.phone || currentUserInfo.phone,
            address: userData.address || currentUserInfo.address
          };
          
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        console.error('Profil bilgileri getirme hatası:', error);
        setError('Profil bilgileriniz yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value
    });
    
    // İlgili alanın hata mesajını temizle
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!userInfo.name.trim()) {
      errors.name = 'Ad Soyad alanı gereklidir';
    }
    
    if (!userInfo.email.trim()) {
      errors.email = 'E-posta alanı gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    
    if (userInfo.phone && !/^(\+90|0)?[0-9]{10}$/.test(userInfo.phone)) {
      errors.phone = 'Geçerli bir telefon numarası giriniz (örn: 05xxxxxxxxx)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('userToken');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        userInfo,
        config
      );
      
      if (response.data.success) {
        // API'den dönen güncel veriyi kullan
        const userData = response.data.data || {};
        
        // localStorage'daki mevcut kullanıcı bilgilerini al
        const currentUserInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
        
        // Kullanıcı bilgilerini localStorage'da güncelle
        const updatedUserInfo = {
          ...currentUserInfo,
          name: userData.name || userInfo.name,
          email: userData.email || userInfo.email,
          phone: userData.phone || userInfo.phone,
          address: userData.address || userInfo.address
        };
        
        // Güncellenmiş bilgileri localStorage'a kaydet
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        
        // localStorage değişikliğini bildirmek için event tetikle
        window.dispatchEvent(new Event('storage'));
        
        console.log('Profil güncellendi:', updatedUserInfo);
        setSuccess('Profil bilgileriniz başarıyla güncellendi.');
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      setError(
        error.response?.data?.message ||
        'Profil bilgileriniz güncellenirken bir hata oluştu.'
      );
    } finally {
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Profil bilgileriniz yükleniyor...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm profile-card">
            <Card.Header className="bg-primary text-white py-3">
              <h4 className="mb-0">Profil Bilgilerim</h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={userInfo.name}
                    onChange={handleChange}
                    isInvalid={!!formErrors.name}
                    className="profile-input"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>E-posta Adresi</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={userInfo.email}
                    onChange={handleChange}
                    isInvalid={!!formErrors.email}
                    className="profile-input"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Telefon Numarası</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={userInfo.phone}
                    onChange={handleChange}
                    isInvalid={!!formErrors.phone}
                    placeholder="05xxxxxxxxx"
                    className="profile-input"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.phone}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Siparişleriniz için iletişim numarası
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Adres</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={userInfo.address}
                    onChange={handleChange}
                    placeholder="Teslimat için varsayılan adresiniz"
                    className="profile-input"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={updating}
                    className="py-2 profile-button"
                  >
                    {updating ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Güncelleniyor...
                      </>
                    ) : (
                      'Profili Güncelle'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage; 