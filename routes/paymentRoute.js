const express = require('express');
const router = express.Router();
const PaymentController = require('../controller/paymentController');

// Show payment page
router.get('/payment', PaymentController.showPaymentPage);

// Process payments
router.post('/vnpay/create', PaymentController.processVNPayPayment);
router.post('/paypal/create', PaymentController.processPayPalPayment);

// Handle callbacks
router.get('/vnpay/callback', PaymentController.handleVNPayCallback);
router.post('/paypal/callback', PaymentController.handlePayPalCallback);

module.exports = router;
