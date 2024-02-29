const express = require('express');
const { postQnA, sendToUsers } = require('./updates.js');

const app = express();
app.use(express.json()); 

// if we receive something at the webhook endpoint
app.post('/', (req, res) => {
	const event = req.body;
  global.questionType = event['type'] // accessible everywhere
  console.log(event);
  
  postQnA(event['input']['question'], event['input']['answers']);

  // send the message out 1 minute early bc of Whatsapp delay
  const delay = new Date(event['input']['date']) - new Date() - 60000;
  setTimeout(() => {
  	sendToUsers(event['description']);
  }, delay);

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log("Delivery Server Started!");
});

