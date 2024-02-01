require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());

//EAAK9nnpUA3YBOy18Dm7lyIKGHWcmx0Xf4HEMEfR58f4NKNG28r5dArYzDaMorkB2gZCTrumCmIysvfREYNn9O882lqkwN0Fj8k8r3LJPI9bgzoRPnxY7PlFJcq8m5QGTGbi8eZB3EMiKZBCqZCLfWBgT3NyeMR0iyOqLt80ZBDYe3ikzPRB20n3s1ctmMQRlk

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
  //const body = JSON.parse(req);
  //console.log(req.body['entry'][0]['changes'][0]['value']['messages'][0]['text']['body']);
  //res.send(req);
  
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