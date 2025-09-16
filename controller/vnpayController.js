const crypto = require('crypto');
const moment = require('moment');

const VNPayController = {
    createPayment: async (req, res) => {
        try {
            const ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;

            const tmnCode = process.env.VNPAY_TMN_CODE;
            const secretKey = process.env.VNPAY_HASH_SECRET;
            let vnpUrl = process.env.VNPAY_URL;
            
            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const orderId = moment(date).format('DDHHmmss');
            
            const amount = req.body.amount;
            const bankCode = req.body.bankCode || '';
            const orderInfo = req.body.orderDescription || 'Thanh toan don hang';
            const orderType = 'billpayment';
            const locale = req.body.language || 'vn';
            const currCode = 'VND';
            
            let vnp_Params = {
                'vnp_Version': '2.1.0',
                'vnp_Command': 'pay',
                'vnp_TmnCode': tmnCode,
                'vnp_Locale': locale,
                'vnp_CurrCode': currCode,
                'vnp_TxnRef': orderId,
                'vnp_OrderInfo': orderInfo,
                'vnp_OrderType': orderType,
                'vnp_Amount': amount * 100,
                'vnp_ReturnUrl': process.env.VNPAY_RETURN_URL,
                'vnp_IpAddr': ipAddr,
                'vnp_CreateDate': createDate
            };

            if (bankCode !== '') {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            const querystring = require('qs');
            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

            // Lưu thông tin đơn hàng vào database
            const bill = new Bill({
                orderCode: orderId,
                amount: amount,
                status: 'PENDING',
                paymentMethod: 'VNPAY',
                orderInfo: orderInfo,
                createDate: date
            });
            await bill.save();

            res.json({ code: '00', data: vnpUrl });
        } catch (error) {
            console.error('Error creating VNPay payment:', error);
            res.status(500).json({ code: '99', message: 'Internal server error' });
        }
    },

    verifyReturnUrl: async (req, res) => {
        try {
            const vnp_Params = req.query;
            const secureHash = vnp_Params['vnp_SecureHash'];
            
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            const querystring = require('qs');
            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET);
            const signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     

            if(secureHash === signed){
                const orderId = vnp_Params['vnp_TxnRef'];
                const rspCode = vnp_Params['vnp_ResponseCode'];

                // Cập nhật trạng thái đơn hàng
                if(rspCode === '00') {
                    await Bill.findOneAndUpdate(
                        { orderCode: orderId },
                        { 
                            status: 'COMPLETED',
                            paymentDetails: vnp_Params
                        }
                    );
                    res.redirect('/success');
                } else {
                    await Bill.findOneAndUpdate(
                        { orderCode: orderId },
                        { 
                            status: 'FAILED',
                            paymentDetails: vnp_Params
                        }
                    );
                    res.redirect('/cancel');
                }
            } else {
                res.status(400).json({message: 'Invalid signature'});
            }
        } catch (error) {
            console.error('Error verifying VNPay return URL:', error);
            res.status(500).json({message: 'Internal server error'});
        }
    }
};

module.exports = VNPayController;