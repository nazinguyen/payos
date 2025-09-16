const express = require('express');
const cookieParser = require('cookie-parser');
const PayOS = require('@payos/node');
const path = require('path');
const connectDB = require('./setupdb');
const { securityMiddleware } = require('./middleware/security');

// Import routes
const paymentRoute = require('./routes/paymentRoute');
const paypalRoute = require('./routes/paypalRoute');
const vnpayRoute = require('./routes/vnpayRoute');
const cartRoute = require('./routes/cartRoute');

// Load environment variables
require('dotenv').config();

const app = express();

// Security Middleware
app.use(securityMiddleware);

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static('public'));
app.use(express.static('assets'));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize PayOS
const payos = new PayOS(
    process.env.CLIENT_ID,
    process.env.API_KEY,
    process.env.CHECKSUM_KEY
);

// Database Connection
connectDB()
    .then(() => {
        console.log('Database connection established');
    })
    .catch((err) => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api', paymentRoute);
app.use('/api/paypal', paypalRoute);
app.use('/cart', cartRoute);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('pages/error', {
        error: {
            message: 'Page not found',
            status: 404
        }
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
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