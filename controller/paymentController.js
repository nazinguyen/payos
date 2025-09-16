const Bill = require('../models/billSchema');
const Product = require('../models/productSchema');
const VNPayService = require('../services/vnpayService');
const PayPalService = require('../services/paypalService');

const PaymentController = {
    async showPaymentPage(req, res) {
        try {
            const cartItems = req.session.cart || [];
            if (cartItems.length === 0) {
                return res.redirect('/cart');
            }

            const productDetails = await Promise.all(
                cartItems.map(async (item) => {
                    const product = await Product.findById(item.productId);
                    return {
                        name: product.name,
                        price: product.price,
                        quantity: item.quantity
                    };
                })
            );

            const totalAmount = productDetails.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            const bill = new Bill({
                items: productDetails,
                amount: totalAmount,
                status: 'PENDING'
            });
            await bill.save();

            res.render('pages/bill', {
                bill,
                cartItems: productDetails
            });
        } catch (error) {
            console.error('Payment page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    async processVNPayPayment(req, res) {
        try {
            const billId = req.body.billId;
            const bill = await Bill.findById(billId);
            if (!bill) {
                return res.status(404).send('Bill not found');
            }

            const result = await VNPayService.createPayment(bill);
            res.json(result);
        } catch (error) {
            console.error('VNPay payment error:', error);
            res.status(500).send('Payment processing failed');
        }
    },

    async processPayPalPayment(req, res) {
        try {
            const billId = req.body.billId;
            const bill = await Bill.findById(billId);
            if (!bill) {
                return res.status(404).send('Bill not found');
            }

            const result = await PayPalService.createPayment(bill);
            res.json(result);
        } catch (error) {
            console.error('PayPal payment error:', error);
            res.status(500).send('Payment processing failed');
        }
    },

    async handleVNPayCallback(req, res) {
        try {
            const result = await VNPayService.handleCallback(req.query);
            if (result.success) {
                req.session.cart = [];
                res.redirect('/success');
            } else {
                res.redirect('/cancel');
            }
        } catch (error) {
            console.error('VNPay callback error:', error);
            res.redirect('/cancel');
        }
    },

    async handlePayPalCallback(req, res) {
        try {
            const result = await PayPalService.handleCallback(req.body);
            if (result.success) {
                req.session.cart = [];
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        } catch (error) {
            console.error('PayPal callback error:', error);
            res.status(500).json({ success: false });
        }
    }
};

module.exports = PaymentController;