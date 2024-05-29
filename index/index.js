const crypto = require('crypto');
const express = require('express');
const { checkKeyword, addTimestamp } = require('./keywords.js');

const app = express();
app.use(express.json()); 

const verify_token = process.env.VERIFY_TOKEN;

// for uptime checker
app.get('/health', (req, res) => {
  if(req.get('token') === verify_token) {
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

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

  // make sure it's the right phone number
  if(req.body['entry'][0]['changes'][0]['value']['metadata']['display_phone_number'] !== process.env.DISPLAY_NUMBER) {
    res.sendStatus(400);
    return;
  }

  // process messages
  const message = req.body['entry'][0]['changes'][0]['value']['messages']?.[0];
  let number = message?.['from'];
  // must be a text
  if(message && message['type'] === 'text') {
  	checkKeyword(message['text']['body'], message['timestamp'], number);
    res.sendStatus(200);
    return;
  }
  else if(message && message['type'] === 'interactive') {
    if(message['interactive']['type'] === 'button_reply') {
      checkKeyword(message['interactive']['button_reply']['title'], message['timestamp'], number);
      res.sendStatus(200);
      return;
    }
    else if(message['interactive']['type'] === 'list_reply') {
      checkKeyword(message['interactive']['list_reply']['title'], message['timestamp'], number);
      res.sendStatus(200);
      return;
    }
  }

  // process statuses
  const status = req.body['entry'][0]['changes'][0]['value']['statuses']?.[0];
  number = status?.['recipient_id'];
  // must be a "sent" status
  if(status && status['status'] === 'sent') {
    addTimestamp(status['id'], status['timestamp'], number);
  }
  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 7000;
app.listen(port, () => {
  console.log('Whatsapp Webhook Server Started!');
});
