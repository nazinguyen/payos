const router = require('express').Router();
const paypalController = require('../controller/paypalController');
const { rateLimiter } = require('../middleware/security');

// Create PayPal order
router.post('/create-order', rateLimiter, paypalController.createOrder);

// Capture PayPal order
router.post('/capture-order', rateLimiter, paypalController.captureOrder);

// Cancel PayPal order
router.post('/cancel-order/:orderID', rateLimiter, paypalController.cancelOrder);

module.exports = router;