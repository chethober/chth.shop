const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const auth = require('../controllers/auth.controller');
const users = require('../controllers/users.controller');
const artists = require('../controllers/artists.controller');
const products = require('../controllers/products.controller');
const cart = require('../controllers/cart.controller');
const orders = require('../controllers/orders.controller');

const router = express.Router();

/* ---------- Meta ---------- */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CHTH API',
    endpoints: ['/auth', '/users', '/products', '/artists', '/cart', '/orders', '/health'],
  });
});
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

/* ---------- Auth ---------- */
router.get('/auth/google', auth.startGoogle);
router.get('/auth/google/callback', auth.googleCallback);
// `/twitter` aliases are kept because they may be registered as OAuth callback URLs.
router.get(['/auth/x', '/auth/twitter'], auth.startX);
router.get(['/auth/x/callback', '/auth/twitter/callback'], auth.xCallback);
router.get('/auth/telegram', auth.startTelegram);
router.get('/auth/telegram/callback', auth.telegramCallback);
router.get('/auth/telegram/bot', auth.startTelegramBot);
router.get('/auth/telegram/bot/callback', auth.telegramBotCallback);
router.get('/auth/me', requireAuth, auth.getMe);
router.put('/auth/username', requireAuth, auth.updateUsername);

/* ---------- Users ---------- */
router.get('/users/me', requireAuth, users.getMe);
router.get('/users/username-available', requireAuth, users.checkUsername);
router.delete('/users/me', requireAuth, users.deleteMe);

/* ---------- Artists ---------- */
router.get('/artists', artists.listArtists);
router.get('/artists/profile/me', requireAuth, artists.getMyProfile);
router.post('/artists/contract/accept', requireAuth, artists.acceptContract);
router.post('/artists', requireAuth, artists.createProfile);
router.put('/artists', requireAuth, artists.updateProfile);
router.delete('/artists', requireAuth, artists.deleteProfile);
router.get('/artists/:username', artists.getArtistByUsername);

/* ---------- Products ---------- */
router.get('/products', optionalAuth, products.listProducts);
router.get('/products/user/me', requireAuth, products.listMyProducts);
router.get('/products/artist/:username', products.listArtistProducts);
router.get('/products/:id', products.getProduct);
router.post('/products', requireAuth, products.createProduct);
router.put('/products/:id', requireAuth, products.updateProduct);
router.delete('/products/:id', requireAuth, products.deleteProduct);

/* ---------- Cart ---------- */
router.get('/cart', requireAuth, cart.getCart);
router.post('/cart', requireAuth, cart.addItem);
router.delete('/cart', requireAuth, cart.clearCart);
router.put('/cart/items/:itemId', requireAuth, cart.updateItem);
router.delete('/cart/items/:itemId', requireAuth, cart.removeItem);

/* ---------- Orders ---------- */
router.get('/orders', requireAuth, orders.listOrders);
router.post('/orders', requireAuth, orders.createOrder);
router.get('/orders/:orderId', requireAuth, orders.getOrder);
router.put('/orders/:orderId/cancel', requireAuth, orders.cancelOrder);

module.exports = router;
