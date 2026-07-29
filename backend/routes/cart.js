const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// Test route to verify cart endpoint is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Cart endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// All cart routes require authentication
router.use(authenticateToken);

// Get user's cart
router.get('/', getUserCart);

// Add item to cart
router.post('/add', addToCart);

// Update cart item quantity
router.put('/items/:itemId', updateCartItem);

// Remove item from cart
router.delete('/items/:itemId', removeFromCart);

// Clear cart
router.delete('/clear', clearCart);

module.exports = router; 