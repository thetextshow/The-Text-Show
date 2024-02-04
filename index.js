require('dotenv').config(); // not sure if needed

const express = require('express');

const app = express();
app.use(express.json()); 

const verify_token = process.env.VERIFY_TOKEN;
const auth_token = process.env.AUTH_TOKEN;

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
  // implicitly global. not strict
  message = req.body['entry'][0]['changes'][0]['value']['messages']?.[0];
  
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
  console.log(`auth token: ${auth_token}`);
});

const axios = require('axios');

function sendMessage(to, msg) {
	const data = JSON.stringify({
	  "messaging_product": "whatsapp",
	  "to": to,
  	  "type": "text",
      "text": {
      	"body": msg
      }
	});

	const config = {
	  method: 'post',
	  maxBodyLength: Infinity,
	  url: 'https://graph.facebook.com/v18.0/207079465828031/messages',
	  headers: { 
	    'Content-Type': 'application/json', 
	    'Authorization': 'Bearer ' + auth_token
	  },
	  data: data
	};

	axios.request(config)
	.then((response) => {
	  console.log(JSON.stringify(response.data));
	})
	.catch((error) => {
	  console.log(error.response.data);
	});
}

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const serviceAccount = require('./the-text-show-firebase-adminsdk-7goi3-5b0b5878e8.json');
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore();

async function checkKeyword(word) {
	const snapshot = await db.collection('keywords').doc('GCRHh18ZgczCaEZKdKk3').get();
	const keywords = snapshot.data()['keywords'];
	
	if(word in keywords) {
		eval(keywords[word]);
	}
	else {
		noKeyword(word);
	}

	
}

function help() {
	sendMessage(message['from'], "You typed HELP");
}

function play() {
	sendMessage(message['from'], "You typed PLAY");
}

function stop() {
	sendMessage(message['from'], "You typed STOP");
}

function noKeyword(word) {
	sendMessage(message['from'], word + " is not a keyword...");
}
