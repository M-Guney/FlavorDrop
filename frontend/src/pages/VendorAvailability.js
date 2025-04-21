import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const navigate = useNavigate();
  
  // Türkçe gün isimleri ve sıralama
  const dayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  
  // Saat seçenekleri
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }
  
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Kullanıcı bilgilerini localStorage'dan al
        const storedUserInfo = localStorage.getItem('userInfo');
        if (!storedUserInfo) {
          navigate('/login');
          return;
        }
        
        const userInfo = JSON.parse(storedUserInfo);
        if (userInfo.role !== 'vendor') {
          navigate('/');
          return;
        }
        
        // Satıcı profilini kontrol et
        const profileRes = await axios.get('http://localhost:5000/api/vendors/profile', config);
        
        if (!profileRes.data.success) {
          navigate('/vendor/profile/create');
          return;
        }
        
        // Müsaitlik verilerini getir
        const res = await axios.get('http://localhost:5000/api/vendors/profile/availability', config);
        
        if (res.data.success) {
          // Günleri doğru sırada dizme
          const sortedAvailability = [...res.data.data].sort((a, b) => {
            return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
          });
          
          setAvailability(sortedAvailability);
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Müsaitlik bilgileri yüklenirken bir hata oluştu'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [navigate]);
  
  const handleIsOpenChange = (index, checked) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index].isOpen = checked;
    setAvailability(updatedAvailability);
  };
  
  const handleTimeChange = (index, field, value) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index][field] = value;
    setAvailability(updatedAvailability);
  };
  
  const handleMaxOrdersChange = (index, value) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index].maxOrdersPerSlot = parseInt(value) || 1;
    setAvailability(updatedAvailability);
  };
  
  const handleSlotDurationChange = (index, value) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index].slotDurationMinutes = parseInt(value) || 15;
    setAvailability(updatedAvailability);
  };
  
  const saveAvailability = async () => {
    try {
      setSaveLoading(true);
      setError('');
      setSuccess(false);
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.put(
        'http://localhost:5000/api/vendors/profile/availability',
        { availability },
        config
      );
      
      if (res.data.success) {
        setSuccess(true);
        // Başarı mesajını 3 saniye sonra kaldır
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Müsaitlik bilgileri kaydedilirken bir hata oluştu'
      );
    } finally {
      setSaveLoading(false);
    }
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

  return (
    <Container className="py-4">
      <Row className="justify-content-md-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Müsaitlik Ayarları</h2>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/vendor/dashboard')}
                >
                  Geri Dön
                </Button>
              </div>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">Müsaitlik bilgileri başarıyla güncellendi!</Alert>}
              
              <p className="text-muted mb-4">
                Restoranınızın hangi günler ve saatlerde hizmet vereceğini ve rezervasyon detaylarını burada ayarlayabilirsiniz.
              </p>
              
              <Table responsive bordered hover>
                <thead className="bg-light">
                  <tr>
                    <th>Gün</th>
                    <th>Durum</th>
                    <th>Açılış Saati</th>
                    <th>Kapanış Saati</th>
                    <th>Zaman Dilimi Başına Maks. Sipariş</th>
                    <th>Zaman Dilimi Süresi (dk)</th>
                  </tr>
                </thead>
                <tbody>
                  {availability.map((day, index) => (
                    <tr key={index}>
                      <td>{day.day}</td>
                      <td>
                        <Form.Check
                          type="switch"
                          id={`isOpen-${index}`}
                          label={day.isOpen ? 'Açık' : 'Kapalı'}
                          checked={day.isOpen}
                          onChange={(e) => handleIsOpenChange(index, e.target.checked)}
                        />
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={day.openTime}
                          onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                          disabled={!day.isOpen}
                        >
                          {timeOptions.map((time) => (
                            <option key={`open-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={day.closeTime}
                          onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                          disabled={!day.isOpen}
                        >
                          {timeOptions.map((time) => (
                            <option key={`close-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          min="1"
                          max="20"
                          value={day.maxOrdersPerSlot}
                          onChange={(e) => handleMaxOrdersChange(index, e.target.value)}
                          disabled={!day.isOpen}
                        />
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={day.slotDurationMinutes}
                          onChange={(e) => handleSlotDurationChange(index, e.target.value)}
                          disabled={!day.isOpen}
                        >
                          <option value="15">15 dakika</option>
                          <option value="30">30 dakika</option>
                          <option value="45">45 dakika</option>
                          <option value="60">1 saat</option>
                          <option value="90">1.5 saat</option>
                          <option value="120">2 saat</option>
                        </Form.Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="text-center mt-4">
                <Button 
                  variant="primary" 
                  onClick={saveAvailability}
                  disabled={saveLoading}
                  className="px-4"
                >
                  {saveLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendorAvailability; 