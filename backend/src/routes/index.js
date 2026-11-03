const express = require('express');
const { requireAuth, optionalAuth, requireAdmin } = require('../middleware/auth');
const auth = require('../controllers/auth.controller');
const users = require('../controllers/users.controller');
const stores = require('../controllers/stores.controller');
const products = require('../controllers/products.controller');
const cart = require('../controllers/cart.controller');
const orders = require('../controllers/orders.controller');
const paymentsController = require('../controllers/payments.controller');
const uploads = require('../controllers/uploads.controller');
const admin = require('../controllers/admin.controller');

const router = express.Router();

/* ---------- Meta ---------- */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CHTH API',
    endpoints: ['/auth', '/users', '/catalog', '/products', '/stores', '/cart', '/orders', '/payments', '/uploads', '/health'],
  });
});
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

/* ---------- Auth (Google + Telegram) ---------- */
router.get('/auth/google', auth.startGoogle);
router.get('/auth/google/callback', auth.googleCallback);
router.get('/auth/telegram/config', auth.telegramConfig);
router.get('/auth/telegram/callback', auth.telegramCallback);
router.post('/auth/telegram', auth.telegramLogin);
router.get('/auth/me', requireAuth, auth.getMe);
router.put('/auth/username', requireAuth, auth.updateUsername);

/* ---------- Users ---------- */
router.get('/users/me', requireAuth, users.getMe);
router.get('/users/username-available', requireAuth, users.checkUsername);
router.delete('/users/me', requireAuth, users.deleteMe);

/* ---------- Stores (artists & merchants) ---------- */
router.get('/stores', stores.listStores);
router.get('/stores/me', requireAuth, stores.getMyStore);
router.get('/stores/me/sales', requireAuth, stores.getMySales);
router.post('/stores/contract/accept', requireAuth, stores.acceptContract);
router.post('/stores', requireAuth, stores.createStore);
router.put('/stores', requireAuth, stores.updateStore);
router.delete('/stores', requireAuth, stores.deleteStore);
router.get('/stores/:username', stores.getStoreByUsername);

/* ---------- Catalog & products ---------- */
router.get('/catalog', products.getCatalog);
router.get('/products', products.listProducts);
router.get('/products/mine', requireAuth, products.listMyProducts);
router.get('/products/:id', optionalAuth, products.getProduct);
router.post('/products', requireAuth, products.createProduct);
router.put('/products/:id', requireAuth, products.updateProduct);
router.delete('/products/:id', requireAuth, products.deleteProduct);

/* ---------- Uploads ---------- */
router.post('/uploads', requireAuth, uploads.uploadImage);

/* ---------- Cart ---------- */
router.get('/cart', requireAuth, cart.getCart);
router.post('/cart', requireAuth, cart.addItem);
router.delete('/cart', requireAuth, cart.clearCart);
router.put('/cart/items/:itemId', requireAuth, cart.updateItem);
router.delete('/cart/items/:itemId', requireAuth, cart.removeItem);

/* ---------- Orders & crypto payments ---------- */
router.get('/orders', requireAuth, orders.listOrders);
router.post('/orders', requireAuth, orders.createOrder);
router.get('/orders/:orderId', requireAuth, orders.getOrder);
router.post('/orders/:orderId/pay', requireAuth, orders.payOrder);
router.put('/orders/:orderId/cancel', requireAuth, orders.cancelOrder);
router.post('/payments/webhook/:provider', paymentsController.webhook);
router.post('/payments/mock/:orderId/confirm', requireAuth, paymentsController.confirmMockPayment);

/* ---------- Admin (fulfillment) ---------- */
router.get('/admin/orders', requireAuth, requireAdmin, admin.listOrders);
router.put('/admin/orders/:orderId/status', requireAuth, requireAdmin, admin.updateOrderStatus);

module.exports = router;
