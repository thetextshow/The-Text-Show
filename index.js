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
	const keySnapshot = await db.collection('keywords').doc('keywords').get();
	const keywords = keySnapshot.data()['keywords'];

	const ansSnapshot = await db.collection('keywords').doc('answers').get();
	const answers = ansSnapshot.data()['answers'];

	/**
	 * If the user sends a keyword, we run that command.
	 * Otherwise, we respond based on what is live. The user
	 * either wins the prize, hears nothing because they were
	 * incorrect during a live competition, or receives an
	 * informative message about the keywords and competitions.
	 **/
	if(word in keywords) {
		// eval runs the function given in firestore
		eval(keywords[word]);
	}
	else {
		const live = whatIsLive();

		if(live === "NONE") {
			// NOT KEY
			sendMessage(message['from'], "NOT KEY");
		}
		else if(live === "FREE" && answers?.[word] === "FREE") {
			// FREE WIN
			sendMessage(message['from'], "FREE WIN");
		}
		else if(live === "PAID") {
			paid = await registeredForPaid();

			if(!paid) {
				// DIFF MESSAGE
				sendMessage(message['from'], "DIFF MESSAGE");
			}
			else if(answers?.[word] === "PAID") {
				// PAID WIN
				sendMessage(message['from'], "PAID WIN");
			}
		}

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

// returns "FREE", "PAID", or "NONE" based on which
// competition is live
function whatIsLive() {
	return "PAID";
}

// returns true if the player paid for the $1 competition
async function registeredForPaid() {
	const user = await db.collection('paid').doc(message['from']).get();

	return user.exists;
}


/*
	// eval runs the function given in firestore
	if(word in keywords) {
		eval(keywords[word]);
	}
	else if(word in answers) {
		eval(answers[word]);
	}
	else {
		noKeyword(word);
	}

function freeAnswer() {
	if(whatIsLive() === "FREE") {
		sendMessage(message['from'], "Correct! You get today's $1 question for free!");
	}
	else if(whatIsLive() === "NONE") {
		// NOT KEY
	}
}

function paidAnswer() {
	if(whatIsLive() === "PAID" && registeredForPaid()) {
		sendMessage(message['from'], "Correct! You win $10,000!");
	}
	else if(whatIsLive() === "NONE") {
		// NOT KEY
	}
}

function noKeyword(word) {
	if(whatIsLive() === "NONE") {
		sendMessage(message['from'], word + " is not a keyword...");
	}
	else if(!registeredForPaid()) {
		sendMessage(message['from'], word + " is not a keyword...\nPAY NOW!!!");
	}
	
}
*/