/**
 * KEYWORDS
 **/

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const sendMessage = require('../messaging/messaging.js');

initializeApp();

const db = getFirestore();
const keywords = {PLAY: "PLAY", HELP: "HELP", STOP: "STOP"};

async function checkKeyword(word, number=phoneNumber) { // phoneNumber is a global var
	
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
			return;
		}
		
		// if there is a live question
		const answersArray = await db.collection('QnA').doc('answers').get();
		const answers = answersArray.data();
		const questionsArray = await db.collection('QnA').doc('questions').get();
		const questions = questionsArray.data();

		const user = await db.collection('users').doc(number).get();
		const convoCount = user.data()['live']['convoCount'];
		
		if(live === "FREE" && answers[live][convoCount] === word) {
			if(convoCount === answers[live] - 1) {
				// FREE WIN
				sendMessage("FREE WIN");
			}
			else {
				sendMessage(questions[live][convoCount+1]);
				await db.collection('users').doc(number).update({
					'convoCount': convoCount+1
				});
			}
		}
		else if(live === "PAID") {
			paid = await registeredForPaid();

			if(!paid) {
				// DIFF MESSAGE
				sendMessage("DIFF MESSAGE");
			}
			else if(answers[live][convoCount] === word) {
				if(convoCount === answers[live] - 1) {
					// PAID WIN
					sendMessage("PAID WIN");
				}
				else {
					sendMessage(questions[live][convoCount+1]);
					await db.collection('users').doc(number).update({
						'convoCount': convoCount+1
					});
				}
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
	return user.data()['live'] ? user.data()['live']['type'] : "NONE";
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