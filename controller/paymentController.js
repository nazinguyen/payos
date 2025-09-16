require('dotenv').config();
const PayOS = require("@payos/node");
// create obj payos
const payos = new PayOS(process.env.CLIENT_ID, process.env.API_KEY, process.env.CHECKSUM_KEY);
const Bill = require('../models/billSchema');
const Product = require('../models/productSchema');
const crypto = require("crypto");
const returnUrl = `http://localhost:${process.env.PORT || 8080}/return`;
const cancelUrl = `http://localhost:${process.env.PORT || 8080}/cancel`;

const processItems = async (items) => {
  try {
    let retn = [];
    let amount = 0;
    for (let item of items) {
      const product = await Product.findOne({ productId: item.productId });
      if (product) {
        retn.push({
          name: product.productName,
          quantity: item.quantity,
          price: product.amount
        });
        amount += product.amount * item.quantity;
      }
    }
    return [retn, amount];
  } catch (err) {
    console.log(err);
    throw err; // Re-throw the error to handle it in the calling function
  }
};

const payment = async (req, res) => {
  try {
    const {
      description,
      items,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
    } = req.body;
    let orderCode;
    while (true) {
      const genId = parseInt(crypto.randomBytes(2).toString("hex"), 16);
      const existingBill = await Bill.findOne({ orderCode: genId });
      if (!existingBill) {
        // If it doesn't exist, assign orderCode and break the loop
        orderCode = genId;
        console.log('genOrderCodee successfull! - ' + orderCode);
        break;
      }
    }
    console.log(items);
    const expiredAt = Math.floor(Date.now() / 1000) + 60 * 30; // 30min
    const calcItems = await processItems(items);
    const requestData = {
      orderCode,
      amount: calcItems[1],
      description,
      cancelUrl,
      returnUrl,
      items: calcItems[0],
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      expiredAt
    };

    // console.log(requestData);
    const pos = await payos.createPaymentLink(requestData);
    // Save the new orderCode in the database
    await Bill.create({ orderCode, link: pos.checkoutUrl});
    res.status(200).json(pos);
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { payment }