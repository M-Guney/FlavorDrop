import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Container, Card, InputGroup, Alert } from 'react-bootstrap';
import axios from 'axios';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Email ve şifre kontrolü
    if (!email || !password) {
      setError('Lütfen email ve şifre giriniz');
      setLoading(false);
      return;
    }

    try {
      // Backend'e giriş isteği at
      const { data } = await axios.post('/api/users/login', { email, password });
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      // Ana sayfaya yönlendir
      navigate('/');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Giriş yapılırken bir hata oluştu'
      );
      console.error('Giriş hatası:', error);
    }
    
    setLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-md-center mt-4">
        <Col md={6}>
          <Card className="shadow rounded">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Giriş Yap</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Adresi</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email adresinizi giriniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Şifre</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Şifrenizi giriniz"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3" controlId="rememberMe">
                  <Form.Check
                    type="checkbox"
                    label="Beni hatırla"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    className="btn-block"
                    disabled={loading}
                  >
                    {loading ? (
                      <span>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Giriş yapılıyor...
                      </span>
                    ) : (
                      'Giriş Yap'
                    )}
                  </Button>
                </div>
              </Form>

              <div className="mt-3 text-center">
                <Link to="/forgot-password" className="text-decoration-none">
                  Şifrenizi mi unuttunuz?
                </Link>
              </div>

              <hr className="my-4" />

              <div className="d-grid gap-2">
                <Button variant="outline-primary" className="btn-block mb-2">
                  <i className="fab fa-google me-2"></i>
                  Google ile Giriş Yap
                </Button>
                <Button variant="outline-primary" className="btn-block">
                  <i className="fab fa-facebook-f me-2"></i>
                  Facebook ile Giriş Yap
                </Button>
              </div>

              <div className="text-center mt-4">
                Hesabınız yok mu?{' '}
                <Link to="/register" className="text-decoration-none">
                  Kayıt Ol
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginScreen; 