require('dotenv').config(); // not sure if needed

const express = require('express');
const checkKeyword = require('./keywords.js');

const app = express();
app.use(express.json()); 

const verify_token = process.env.VERIFY_TOKEN;

// for webhook verification from Meta
app.get('/', (req, res) => {
  if(req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == verify_token) {
    
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(200);
  }
});

// if we receive something at the webhook endpoint
app.post('/', (req, res) => {
  const message = req.body['entry'][0]['changes'][0]['value']['messages']?.[0];
  global.phoneNumber = message?.['from']; // accessible in all files

  // must be a text
  if(message && message['type'] === 'text') {
  	checkKeyword(message['text']['body']);
  }

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`verify token: ${verify_token}`);
});