import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isVendor: false
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const { name, email, password, confirmPassword, isVendor } = formData;
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyon kontrolleri
    if (!name || !email || !password || !confirmPassword) {
      setError('Lütfen tüm gerekli alanları doldurun');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Kayıt isteği gönder
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role: isVendor ? 'vendor' : 'user'
      });
      
      // API'den dönen kullanıcı verilerini al
      let userData = response.data;
      console.log('Register response RAW:', JSON.stringify(userData));
      
      // API'den kullanıcı adı gelmediyse, formdan alınan ismi ekle
      // Ve rol bilgisinin doğru işlendiğinden emin ol
      userData = {
        ...userData,
        name: userData.name || name,
        email: userData.email || email,
        role: isVendor ? 'vendor' : (userData.role || 'user')
      };
      
      console.log('Processed register data:', JSON.stringify(userData));
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('userInfo', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      
      // Tarayıcı olayını tetikle (Header ve diğer bileşenler için)
      window.dispatchEvent(new Event('storage'));
      
      setSuccess(true);
      
      // Başarılı kayıt sonrası 2 saniye bekleyip ana sayfaya yönlendir
      setTimeout(() => {
        if (isVendor) {
          navigate('/vendor/profile/create');
        } else {
          navigate('/');
        }
      }, 2000);
    } catch (error) {
      console.error('Register error:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Kayıt sırasında bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Kayıt Ol</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  Kayıt başarılı! {isVendor 
                    ? 'Restoran profili oluşturma sayfasına' 
                    : 'Ana sayfaya'} yönlendiriliyorsunuz...
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ad soyad girin"
                    name="name"
                    value={name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email adresinizi girin"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Şifre oluşturun"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Şifre Tekrar</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Şifrenizi tekrar girin"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="isVendor">
                  <Form.Check
                    type="checkbox"
                    label="Restoran sahibiyim ve yemek satmak istiyorum"
                    name="isVendor"
                    checked={isVendor}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <div className="d-grid gap-2 mb-3">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading || success}
                  >
                    {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                  </Button>
                </div>
                
                <div className="text-center">
                  Zaten bir hesabınız var mı? <Link to="/login">Giriş Yap</Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage; 