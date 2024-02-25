/**
 * KEYWORDS
 **/

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const sendMessage = require('./messaging.js');

//const serviceAccount = require('./the-text-show-firebase-adminsdk-7goi3-5b0b5878e8.json');
initializeApp();

const db = getFirestore();
const keywords = {PLAY: "PLAY", HELP: "HELP", STOP: "STOP"};

async function checkKeyword(word, number=phoneNumber) { // phoneNumber is a global var
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
		else if(live === "FREE" && answers["FREE"] === word) {
			// FREE WIN
			sendMessage("FREE WIN");
		}
		else if(live === "PAID") {
			paid = await registeredForPaid();

			if(!paid) {
				// DIFF MESSAGE
				sendMessage("DIFF MESSAGE");
			}
			else if(answers["PAID"] === word) {
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
			number: number,
			createdAt: FieldValue.serverTimestamp()
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
async function whatIsLive(number=phoneNumber) {
	const user = await db.collection('users').doc(number).get();
	return user.data()['live'] ? user.data()['live.type'] : "NONE";
}

// returns true if the player paid for the $1 competition
async function registeredForPaid(number=phoneNumber) {
	const user = await db.collection('paid').doc(number).get();
	return user.exists;
}

// records the actual time the player received the question
async function addTimestamp(wamid, timestamp, number=phoneNumber) {
	const user = await db.collection('users').doc(number).get();
	if(user.data()['live']?.['wamid'] === wamid) {
		await db.collection('users').doc(number).update({
			['live.sentTime']: timestamp
		});
	}
}

module.exports = { checkKeyword, addTimestamp };