import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container>
        <Row>
          <Col className="text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} Yemek Rezervasyon - Tüm Hakları Saklıdır</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 