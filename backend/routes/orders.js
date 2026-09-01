const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// All order routes require authentication
router.use(authenticateToken);

// POST /api/orders & POST /api/orders/checkout - Create order from cart
router.post('/', createOrder);
router.post('/checkout', createOrder);

// GET /api/orders - Get current user's orders
router.get('/', getUserOrders);

// GET /api/orders/:orderId - Get single order details
router.get('/:orderId', getOrder);

// PUT /api/orders/:orderId/cancel - Cancel order
router.put('/:orderId/cancel', cancelOrder);

// PUT /api/orders/:orderId - Update order
router.put('/:orderId', updateOrderStatus);
router.put('/:orderId/status', updateOrderStatus);

// DELETE /api/orders/:orderId - Delete order
router.delete('/:orderId', deleteOrder);

module.exports = router;