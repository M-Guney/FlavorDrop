import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VendorDashboard from './pages/VendorDashboard';
import VendorProfileCreate from './pages/VendorProfileCreate';
import VendorProfileEdit from './pages/VendorProfileEdit';
import VendorAvailability from './pages/VendorAvailability';
import VendorMenu from './pages/VendorMenu';
import VendorAddMenuItem from './pages/VendorAddMenuItem';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <main className="py-3 flex-grow-1">
          <Container>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Satıcı Sayfaları */}
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/profile/create" element={<VendorProfileCreate />} />
              <Route path="/vendor/profile/edit" element={<VendorProfileEdit />} />
              <Route path="/vendor/availability" element={<VendorAvailability />} />
              <Route path="/vendor/menu" element={<VendorMenu />} />
              <Route path="/vendor/menu/add" element={<VendorAddMenuItem />} />
            </Routes>
          </Container>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 