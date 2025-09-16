const paypal = require('@paypal/checkout-server-sdk');
const Bill = require('../models/billSchema');

// PayPal configuration
let environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
let client = new paypal.core.PayPalHttpClient(environment);

const paypalController = {
    // Create PayPal Order
    createOrder: async (req, res) => {
        try {
            const { items, total } = req.body;
            const request = new paypal.orders.OrdersCreateRequest();
            
            request.prefer("return=representation");
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: total,
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: total
                            }
                        }
                    },
                    items: items.map(item => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: 'USD',
                            value: item.price
                        },
                        quantity: item.quantity
                    }))
                }]
            });

            const order = await client.execute(request);
            
            // Save order to database
            const bill = new Bill({
                orderCode: order.result.id,
                amount: total,
                status: 'PENDING',
                paymentMethod: 'PAYPAL',
                items: items,
                paymentDetails: order.result
            });
            await bill.save();

            res.json({ orderID: order.result.id });
        } catch (err) {
            console.error('Error creating PayPal order:', err);
            res.status(500).json({ error: 'Error creating order' });
        }
    },

    // Capture PayPal Order
    captureOrder: async (req, res) => {
        try {
            const { orderID } = req.body;
            const request = new paypal.orders.OrdersCaptureRequest(orderID);
            
            const capture = await client.execute(request);
            
            // Update bill status
            await Bill.findOneAndUpdate(
                { orderCode: orderID },
                { 
                    status: 'COMPLETED',
                    paymentDetails: capture.result
                }
            );

            res.json({ 
                status: 'COMPLETED',
                orderID: capture.result.id
            });
        } catch (err) {
            console.error('Error capturing PayPal order:', err);
            res.status(500).json({ error: 'Error capturing order' });
        }
    },

    // Cancel PayPal Order
    cancelOrder: async (req, res) => {
        try {
            const { orderID } = req.params;
            
            await Bill.findOneAndUpdate(
                { orderCode: orderID },
                { status: 'CANCELLED' }
            );

            res.json({ status: 'CANCELLED' });
        } catch (err) {
            console.error('Error cancelling PayPal order:', err);
            res.status(500).json({ error: 'Error cancelling order' });
        }
    }
};

module.exports = paypalController;