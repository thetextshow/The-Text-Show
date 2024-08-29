const stripe = require("stripe")("sk_test_51PGW9aRvtqFyjwSyPZra20IrMp4lT5QPaR4LDlUjtIfhjJplY3hdky9sTEzIxf4Nd2chmVXOWOSYee7THtoYIPlZ00PgIbiV4i");
const express = require('express');

const app = express();
app.use(express.json()); 

app.post('/create-intent', async (req, res) => {
  const intent = await stripe.setupIntents.create({
    customer: 'cus_QGmu2ZEOJVI62e',
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {enabled: true},
  });
  console.log(intent);
  res.json({client_secret: intent.client_secret});
});

// starting the server
const port = parseInt(process.env.PORT) || 6000;
app.listen(port, () => {
  console.log('Payments Server Started!');
});