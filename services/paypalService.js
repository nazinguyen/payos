const paypal = require('@paypal/checkout-server-sdk');
const Bill = require('../models/billSchema');

// PayPal configuration
let environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
let client = new paypal.core.PayPalHttpClient(environment);

const PayPalService = {
    async createPayment(bill) {
        try {
            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            
            const items = bill.items.map(item => ({
                name: item.name,
                unit_amount: {
                    currency_code: 'USD',
                    value: (item.price / 23000).toFixed(2) // Convert VND to USD
                },
                quantity: item.quantity
            }));

            const total = bill.amount / 23000; // Convert VND to USD

            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: total.toFixed(2)
                            }
                        }
                    },
                    items: items
                }]
            });

            const order = await client.execute(request);
            return { orderID: order.result.id };

        } catch (error) {
            console.error('PayPal service error:', error);
            throw error;
        }
    },

    async handleCallback(body) {
        try {
            const { orderID } = body;
            const request = new paypal.orders.OrdersCaptureRequest(orderID);
            const capture = await client.execute(request);

            if (capture.result.status === 'COMPLETED') {
                await Bill.findOneAndUpdate(
                    { orderCode: orderID },
                    {
                        status: 'COMPLETED',
                        paymentDetails: capture.result
                    }
                );
                return { success: true, orderCode: orderID };
            }

            await Bill.findOneAndUpdate(
                { orderCode: orderID },
                {
                    status: 'FAILED',
                    paymentDetails: capture.result
                }
            );
            return { success: false, orderCode: orderID };

        } catch (error) {
            console.error('PayPal callback error:', error);
            throw error;
        }
    }
};

module.exports = PayPalService;