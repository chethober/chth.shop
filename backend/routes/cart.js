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

// All cart routes require authentication
router.use(authenticateToken);

// GET /api/cart - Get user's cart
router.get('/', getUserCart);

// POST /api/cart & POST /api/cart/add - Add item to cart
router.post('/', addToCart);
router.post('/add', addToCart);

// PUT /api/cart/items/:itemId - Update cart item quantity
router.put('/items/:itemId', updateCartItem);

// DELETE /api/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId', removeFromCart);

// DELETE /api/cart & DELETE /api/cart/clear - Clear cart
router.delete('/', clearCart);
router.delete('/clear', clearCart);

module.exports = router;