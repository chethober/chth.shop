const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder
} = require('../controllers/orderController');

// All order routes require authentication
router.use(authenticateToken);

// Create order from cart (checkout)
router.post('/checkout', createOrder);

// Get user's orders
router.get('/', getUserOrders);

// Get specific order
router.get('/:orderId', getOrder);

// Cancel order
router.put('/:orderId/cancel', cancelOrder);

module.exports = router; 