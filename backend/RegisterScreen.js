import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaStore } from 'react-icons/fa';
import axios from 'axios';

const RegisterScreen = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    isVendor: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { name, email, password, confirmPassword, phone, isVendor } = formData;
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const submitHandler = async (e) => {
    e.preventDefault();
    
    // Doğrulama işlemleri
    if (!name || !email || !password || !confirmPassword || !phone) {
      setError('Lütfen tüm alanları doldurun');
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
    
    // E-posta doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Geçerli bir e-posta adresi giriniz');
      return;
    }
    
    // Telefon doğrulama (basit)
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone)) {
      setError('Geçerli bir telefon numarası giriniz (10-11 rakam)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Backend'e kayıt isteği at
      const { data } = await axios.post('/api/users/register', {
        name,
        email,
        password,
        role: isVendor ? 'vendor' : 'user'
      });
      
      setSuccess(true);
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      // 2 saniye sonra yönlendir
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Kayıt işlemi sırasında bir hata oluştu'
      );
      console.error('Kayıt hatası:', error);
    }
    
    setLoading(false);
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0 rounded-lg">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h2>Hesap Oluştur</h2>
            </Card.Header>
            
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  Kayıt başarılı! Ana sayfaya yönlendiriliyorsunuz...
                </Alert>
              )}
              
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Ad Soyad"
                      name="name"
                      value={name}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>E-posta Adresi</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <Form.Control
                      type="email"
                      placeholder="E-posta"
                      name="email"
                      value={email}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifre"
                      name="password"
                      value={password}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Şifre Tekrar</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifre Tekrar"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  <Form.Check
                    type="checkbox"
                    label="Şifreyi göster"
                    className="mt-2"
                    onChange={() => setShowPassword(!showPassword)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Telefon</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaPhone />
                    </span>
                    <Form.Control
                      type="tel"
                      placeholder="Telefon Numarası"
                      name="phone"
                      value={phone}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <div className="d-flex align-items-center">
                    <FaStore className="me-2" />
                    <Form.Check
                      type="checkbox"
                      label="Restoran sahibiyim ve yemek satmak istiyorum"
                      name="isVendor"
                      checked={isVendor}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || success}
                  >
                    {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            
            <Card.Footer className="text-center py-3">
              <p className="mb-0">
                Zaten bir hesabınız var mı?{' '}
                <Link to="/login" className="text-decoration-none">
                  Giriş Yap
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterScreen; 