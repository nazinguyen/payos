const router = require('express').Router();
const vnpayController = require('../controller/vnpayController');
const { rateLimiter } = require('../middleware/security');

// Tạo URL thanh toán VNPay
router.post('/create-payment', rateLimiter, vnpayController.createPayment);

// Xử lý kết quả thanh toán từ VNPay
router.get('/vnpay/return', vnpayController.verifyReturnUrl);

module.exports = router;