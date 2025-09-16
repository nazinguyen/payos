const express = require('express');
const router = express.Router();
const PaymentController = require('../controller/paymentController');
const { rateLimiter } = require('../middleware/security');

// Show payment page
router.get('/', PaymentController.showPaymentPage);

// Get available payment methods
router.get('/methods', PaymentController.getPaymentMethods);

// Create payment
router.post('/create', rateLimiter, PaymentController.createPayment);

// Payment callbacks
router.get('/callback/:paymentMethod', PaymentController.handlePaymentCallback);
router.post('/callback/:paymentMethod', PaymentController.handlePaymentCallback);

module.exports = router;