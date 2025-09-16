const vnpayService = require('./vnpayService');
const paypalService = require('./paypalService');

const PaymentService = {
    async processVNPayPayment(bill) {
        return await vnpayService.createPayment(bill);
    },

    async processPayPalPayment(bill) {
        return await paypalService.createPayment(bill);
    },

    async handleVNPayCallback(queryParams) {
        return await vnpayService.handleCallback(queryParams);
    },

    async handlePayPalCallback(body) {
        return await paypalService.handleCallback(body);
    }
};

module.exports = PaymentService;