require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const { checkKeyword, addTimestamp } = require('./keywords.js');

const app = express();
app.use(express.json()); 

const verify_token = process.env.VERIFY_TOKEN;

// for webhook verification from Meta
app.get('/', (req, res) => {
  if(req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === verify_token) {
    
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

// if we receive something at the webhook endpoint
app.post('/', (req, res) => {
  // validate webhook signature from Meta
  try {
    const hash = "sha256=" + crypto.createHmac('sha256', process.env.API_KEY)
      .update(JSON.stringify(req.body)).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), 
      Buffer.from(req.get('X-Hub-Signature-256'), 'hex'));
    if(!isValid) {
      res.sendStatus(400);
      return;
    }
  }
  catch (e) {
    res.sendStatus(400);
    return;
  }

  // process messages
  const message = req.body['entry'][0]['changes'][0]['value']['messages']?.[0];
  global.phoneNumber = message?.['from']; // accessible in all files
  // must be a text
  if(message && message['type'] === 'text') {
  	checkKeyword(message['text']['body']);
    res.sendStatus(200);
    return;
  }

  // process statuses
  const status = req.body['entry'][0]['changes'][0]['value']['statuses']?.[0];
  global.phoneNumber = status?.['recipient_id']; // accessible in all files
  // must be a "sent" status
  if(status && status['status'] === 'sent') {
    addTimestamp(status['id'], status['timestamp']);
  }
  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log('Whatsapp Webhook Server Started!');
});
