const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

const { protect, optionalProtect } = require('../middleware/auth');

// Sepete ekleme ve görüntüleme işlemleri için token olmamasını kabul edebiliriz
router.post('/', optionalProtect, addToCart);
router.get('/', optionalProtect, getCart);

// Diğer sepet rotaları için kullanıcı girişi kesinlikle gerekli
router.delete('/', protect, clearCart);

// Sepetteki belirli bir ürünü güncelleme veya silme
router.route('/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeFromCart);

module.exports = router; 