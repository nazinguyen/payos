const paymentRoute = require('./routes/paymentRoute');
const express = require('express');
// const Product = require('./models/productSchema');
const app = express();
const mongoose = require('./setupdb');
const cookieParser = require('cookie-parser');
const Bill = require('./models/billSchema');
const PayOS = require("@payos/node");

require('dotenv').config();
const payos = new PayOS(process.env.CLIENT_ID, process.env.API_KEY, process.env.CHECKSUM_KEY);
// use static : assets folder
app.use(express.static('assets'));
//use express json
app.use(express.json());
// use cookie
app.use(cookieParser());
// api
app.use('/api', paymentRoute);
app.get('/return', async(req, res) => {
  const { code, id, cancel, status, orderCode } = req.query;
  const test = await payos.getPaymentLinkInformation(orderCode);

  if (code === '00' && test.status == 'PAID'){
    res.render('pages/success', {link: 'https://drive.google.com/file/d/1DaoW9CH7ri29mHZ5Qtxl6uMo-wH3X4ol/view'});
  }else{
    res.send('Failed');
  }
  // Logic to handle successful payment redirection

});

// Endpoint to handle cancelUrl redirection
app.get('/cancel', (req, res) => {
  const { code, id, cancel, status, orderCode } = req.query;
  // Logic to handle payment cancellation or error redirection based on the query parameters

  res.render('pages/cancel', { code, id, cancel, status, orderCode });
});


// set the view engine to ejs
app.set('view engine', 'ejs');
// use res.render to load up an ejs view file
// index page

app.get('/', function (req, res) {
  res.render('pages/index');
});
// about page
app.get('/bill', async function (req, res) {
  try {
    const bills = await Bill.find();
    console.log(bills)
    res.render('pages/bill', { bills });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/cart', function (req, res) {
  res.render('pages/cart');
});

app.get('/bill/:orderCode', async function (req, res) {
  try {
    const orderCode = req.params.orderCode;
    const containsOnlyNumbers = /^\d+$/.test(orderCode); // Check if orderCode contains only numbers
    if (containsOnlyNumbers) {
      const bill = await Bill.findOne({ orderCode: orderCode });
      const content = await payos.getPaymentLinkInformation(orderCode);

      res.render('pages/billContent', { content, link: bill.link, link: 'https://drive.google.com/file/d/1DaoW9CH7ri29mHZ5Qtxl6uMo-wH3X4ol/view' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }

});

const port = process.env.PORT || 8080;

app.listen(port);
console.log(`Server is listening on: http://localhost:${port}`);