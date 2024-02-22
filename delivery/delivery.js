const express = require('express');

const app = express();
app.use(express.json()); 

// for webhook verification from Meta
app.get('/', (req, res) => {
  console.log(req);
  res.sendStatus(200);
});

// if we receive something at the webhook endpoint
app.post('/', (req, res) => {
  console.log(req.body['msg']);
  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log("Delivery Server Started!");
});

const { initializeApp } = require('firebase-admin/app');

const fb = initializeApp();