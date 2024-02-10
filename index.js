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
  phoneNumber = message?.['from'];

  // must be a text
  if(message && message['type'] === 'text') {
  	checkKeyword(message['text']['body'], phoneNumber);
  }

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`verify token: ${verify_token}`);
  console.log(`auth token: ${auth_token}`);
});


/**
 * MESSAGES
 **/

const axios = require('axios');

function sendMessage(msg, to=phoneNumber) {
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


/**
 * KEYWORDS
 **/

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const serviceAccount = require('./the-text-show-firebase-adminsdk-7goi3-5b0b5878e8.json');
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore();

async function checkKeyword(word, number=phoneNumber) {
	const keywords = {PLAY: "PLAY", HELP: "HELP", STOP: "STOP"};

	const snapshot = await db.collection('answers').doc('answers').get();
	const answers = snapshot.data()['answers'];

	// if the user does not exist, we need them to opt in first
	const user = await db.collection('users').doc(number).get();
	if(!user.exists) {
		if(word === "PLAY") {
			play(false);
		}
		else {
			sendMessage("Send PLAY to opt into The Text Show!");
		}
		return;
	} 

	/**
	 * If the user sends a keyword, we run that command.
	 * Otherwise, we respond based on what is live. The user
	 * either is correct, hears nothing because they were
	 * incorrect during a live competition, or receives an
	 * informative message about the keywords and competitions.
	 **/
	if(word in keywords) {
		if(word === "PLAY") {
			await play();
		}
		else if(word === "HELP") {
			help();
		}
		else if(word === "STOP") {
			await stop();
		}
	}
	else {
		const live = await whatIsLive();

		if(live === "NONE") {
			// NOT KEY
			sendMessage("NOT KEY");
		}
		else if(live === "FREE" && answers?.[word] === "FREE") {
			// FREE WIN
			sendMessage("FREE WIN");
		}
		else if(live === "PAID") {
			paid = await registeredForPaid();

			if(!paid) {
				// DIFF MESSAGE
				sendMessage("DIFF MESSAGE");
			}
			else if(answers?.[word] === "PAID") {
				// PAID WIN
				sendMessage("PAID WIN");
			}
		}
	}
}

async function play(userExists=true, number=phoneNumber) {
	if(userExists) {
		sendMessage("You typed PLAY");
	}
	else {
		await db.collection('users').doc(number).set({
			balance: 0,
			number: number
		});
		sendMessage("Welcome!");
	}
}

function help() {
	sendMessage("You typed HELP");
}

async function stop(number=phoneNumber) {
	await db.collection('users').doc(number).delete();
	sendMessage("You have been unsubscribed from The Text Show. Send PLAY to resubscribe.");
}

// returns "FREE", "PAID", or "NONE" based on which
// competition is live
async function whatIsLive() {
	return "PAID";
}

// returns true if the player paid for the $1 competition
async function registeredForPaid(number=phoneNumber) {
	const user = await db.collection('paid').doc(number).get();

	return user.exists;
}