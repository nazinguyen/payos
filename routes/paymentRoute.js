const { Router } = require('express');
const router = Router();
const { payment } = require('../controller/paymentController');
const PayOS = require("@payos/node");
// create obj payos
const payos = new PayOS(process.env.CLIENT_ID, process.env.API_KEY, process.env.CHECKSUM_KEY);

router.route('/payment').post(payment).get(async (req, res) => {
  res.send('hello world');
});
router.route('/del/:code').post(async (req, res) => {
  try{
    await payos.cancelPaymentLink(req.params.code, "test - for caso interview"); 
    console.log('del - successfull');
    res.status(200).send('successfull - del');
  }catch(err){
    res.status(500).send('error - when del');
  }
})
module.exports = router;
