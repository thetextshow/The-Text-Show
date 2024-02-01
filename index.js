require('dotenv').config(); // not sure if needed

const express = require('express');

const app = express();
app.use(express.json()); 

const token = process.env.VERIFY_TOKEN;

app.get('/', (req, res) => {
  if(req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == token) {
    
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(200);
  }
});

app.post('/', (req, res) => {
  const message = getMessage(req);
  if(message['type'] === 'text') {
  	console.log("MESSAGE:", message['text']['body']);
  }

  res.sendStatus(200);
});

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`helloworld: listening on port ${port}`);
});

function getMessage(request) {
	const msg = request.body['entry'][0]['changes'][0]['value']['messages'][0];
	return msg;
}