const crypto = require('crypto');
const moment = require('moment');
const Bill = require('../models/billSchema');

const VNPayService = {
    async createPayment(bill) {
        try {
            if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET || !process.env.VNPAY_URL) {
                throw new Error('Missing VNPay configuration');
            }

            const tmnCode = process.env.VNPAY_TMN_CODE;
            const secretKey = process.env.VNPAY_HASH_SECRET;
            let vnpUrl = process.env.VNPAY_URL;
            
            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            
            const vnp_Params = {
                'vnp_Version': '2.1.0',
                'vnp_Command': 'pay',
                'vnp_TmnCode': tmnCode,
                'vnp_Locale': 'vn',
                'vnp_CurrCode': 'VND',
                'vnp_TxnRef': bill.orderCode,
                'vnp_OrderInfo': bill.orderInfo || 'Payment for order',
                'vnp_OrderType': 'billpayment',
                'vnp_Amount': bill.amount * 100,
                'vnp_ReturnUrl': process.env.VNPAY_RETURN_URL,
                'vnp_IpAddr': bill.ipAddr || '127.0.0.1',
                'vnp_CreateDate': createDate
            };

            const querystring = require('qs');
            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
            vnp_Params['vnp_SecureHash'] = signed;

            return {
                code: '00',
                data: vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false })
            };

        } catch (error) {
            console.error('VNPay service error:', error);
            throw error;
        }
    },

    async handleCallback(queryParams) {
        try {
            const secureHash = queryParams['vnp_SecureHash'];
            delete queryParams['vnp_SecureHash'];
            delete queryParams['vnp_SecureHashType'];

            const secretKey = process.env.VNPAY_HASH_SECRET;
            const querystring = require('qs');
            const signData = querystring.stringify(queryParams, { encode: false });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");     

            if (secureHash === signed) {
                const orderCode = queryParams['vnp_TxnRef'];
                const rspCode = queryParams['vnp_ResponseCode'];
                
                if (rspCode === '00') {
                    await Bill.findOneAndUpdate(
                        { orderCode },
                        {
                            status: 'COMPLETED',
                            paymentDetails: queryParams
                        }
                    );
                    return { success: true, orderCode };
                } else {
                    await Bill.findOneAndUpdate(
                        { orderCode },
                        {
                            status: 'FAILED',
                            paymentDetails: queryParams
                        }
                    );
                    return { success: false, orderCode };
                }
            }
            throw new Error('Invalid signature');
        } catch (error) {
            console.error('VNPay callback error:', error);
            throw error;
        }
    }
};

module.exports = VNPayService;