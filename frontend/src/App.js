import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PasswordChangePage from './pages/PasswordChangePage';
import VendorDashboard from './pages/VendorDashboard';
import VendorProfileCreate from './pages/VendorProfileCreate';
import VendorProfileEdit from './pages/VendorProfileEdit';
import VendorAvailability from './pages/VendorAvailability';
import VendorMenu from './pages/VendorMenu';
import VendorAddMenuItem from './pages/VendorAddMenuItem';
import VendorListPage from './pages/VendorListPage';
import VendorDetailPage from './pages/VendorDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import VendorOrders from './pages/VendorOrders';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminOrders from './pages/admin/AdminOrders';
import AdminVendorDetail from './pages/admin/AdminVendorDetail';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';

// Sepet bağlamı oluştur
export const CartContext = createContext(null);

function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));
  const [cart, setCart] = useState(() => {
    // localStorage'dan sepet bilgilerini al
    const tempCartData = localStorage.getItem('tempCart');
    if (tempCartData) {
      try {
        return JSON.parse(tempCartData);
      } catch (e) {
        console.error("Sepet verisi parse edilemedi:", e);
        return { items: [], totalAmount: 0 };
      }
    }
    return { items: [], totalAmount: 0 };
  });
  
  // Sepet işlemleri
  const addToCart = (item) => {
    const itemId = item._id || item.id || `item_${Date.now()}`;
    
    setCart(prevCart => {
      // Mevcut sepeti kopyala
      const newCart = { ...prevCart };
      
      if (!newCart.items) {
        newCart.items = [];
      }
      
      // Ürün kopyası oluştur
      const menuItemCopy = {
        _id: itemId,
        name: item.name || 'Ürün',
        price: parseFloat(item.price) || 0,
        image: item.image || '',
        description: item.description || ''
      };
      
      // Ürün sepette var mı kontrol et
      const existingItemIndex = newCart.items.findIndex(
        cartItem => cartItem.menuItem._id === itemId
      );
      
      if (existingItemIndex !== -1) {
        // Varsa miktarını artır
        newCart.items[existingItemIndex].quantity += 1;
      } else {
        // Yoksa yeni ekle
        newCart.items.push({
          menuItem: menuItemCopy,
          quantity: 1,
          _id: `temp_${Date.now()}`
        });
      }
      
      // Toplam tutarı hesapla
      let totalAmount = 0;
      newCart.items.forEach(item => {
        totalAmount += (parseFloat(item.menuItem.price) || 0) * (parseInt(item.quantity) || 0);
      });
      
      newCart.totalAmount = totalAmount;
      
      // Sepeti localStorage'a kaydet
      localStorage.setItem('tempCart', JSON.stringify(newCart));
      
      return newCart;
    });
    
    return true; // Başarılı
  };
  
  // Sepetten ürün çıkar
  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      // Mevcut sepeti kopyala
      const newCart = { ...prevCart };
      
      // Ürünü sepetten çıkar
      newCart.items = newCart.items.filter(item => item._id !== itemId);
      
      // Toplam tutarı hesapla
      let totalAmount = 0;
      newCart.items.forEach(item => {
        totalAmount += (parseFloat(item.menuItem.price) || 0) * (parseInt(item.quantity) || 0);
      });
      
      newCart.totalAmount = totalAmount;
      
      // Sepeti localStorage'a kaydet
      localStorage.setItem('tempCart', JSON.stringify(newCart));
      
      return newCart;
    });
  };
  
  // Sepeti temizle
  const clearCart = () => {
    localStorage.removeItem('tempCart');
    setCart({ items: [], totalAmount: 0 });
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <main className="py-3 flex-grow-1">
            <Container>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/password" element={<PasswordChangePage />} />
                
                {/* Kullanıcı Satıcı Listeleme ve Detay Sayfaları */}
                <Route path="/vendors" element={<VendorListPage />} />
                <Route path="/vendors/:id" element={<VendorDetailPage />} />
                
                {/* Sepet ve Sipariş Sayfaları */}
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                
                {/* Satıcı Yönetim Sayfaları */}
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/profile/create" element={<VendorProfileCreate />} />
                <Route path="/vendor/profile/edit" element={<VendorProfileEdit />} />
                <Route path="/vendor/availability" element={<VendorAvailability />} />
                <Route path="/vendor/menu" element={<VendorMenu />} />
                <Route path="/vendor/menu/add" element={<VendorAddMenuItem />} />
                <Route path="/vendor/orders" element={<VendorOrders />} />
                
                {/* Admin Paneli Sayfaları */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/vendors" element={<AdminVendors />} />
                <Route path="/admin/vendors/:id" element={<AdminVendorDetail />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
              </Routes>
            </Container>
          </main>
          <Footer />
        </div>
      </Router>
    </CartContext.Provider>
  );
}

export default App; 