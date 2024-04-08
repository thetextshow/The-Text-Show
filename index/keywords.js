/**
 * KEYWORDS
 **/

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { setDefaultNumber, sendMessage } = require('../messaging/messaging.js');

initializeApp();

const db = getFirestore();
const keywords = {PLAY: "PLAY", HELP: "HELP", STOP: "STOP"};

let phoneNumber;
function setPhoneNumber(number) {
	phoneNumber = number;
	setDefaultNumber(number);
}

async function checkKeyword(word, timestamp, number=phoneNumber) { // phoneNumber is a global var
	console.log(number + " said " + word);
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
	switch (word) {
		case 'PLAY':
			await play();
			break;
		case 'HELP':
			help();
			break;
		case 'STOP':
			await stop();
			break;
		default:
			const live = await whatIsLive(user);
			if(live === "NONE") sendMessage("NOT KEY");
			else await handleAnswer(live, user, word, timestamp);
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

// TODO
async function stop(number=phoneNumber) {
	await db.collection('users').doc(number).delete();
	sendMessage("You have been unsubscribed from The Text Show. Send PLAY to resubscribe.");
}

// returns "FREE", "PAID", or "NONE" based on which
// competition is live
async function whatIsLive(user='none', number=phoneNumber) {
	if(user === 'none') user = await db.collection('users').doc(number).get();
	return user.data()['live']?.['type'] ? user.data()['live']['type'] : "NONE";
}

// returns true if the player paid for the $1 competition
async function registeredForPaid(number=phoneNumber) {
	const user = await db.collection('paid').doc(number).get();
	return user.exists;
}

async function handleAnswer(type, user, word, timestamp, number=phoneNumber) {
	if(!(user.data()['live']['acceptAnswer'])) return;

	await db.collection('users').doc(number).update({
		['live.acceptAnswer']: false
	});

	const answersArray = await db.collection('QnA').doc('answers').get();
	const answers = answersArray.data()[type];
	const questionsArray = await db.collection('QnA').doc('questions').get();
	const questions = questionsArray.data()[type];

	const oldWamid = user.data()['live']['wamid'];
	await db.collection('users').doc(number).update({
		[`live.history.${oldWamid}.reply`]: word,
		[`live.history.${oldWamid}.replyTime`]: timestamp
	});
	const time = timestamp - user.data()['live']['history'][oldWamid]['msgTime'];
	
	const convoCount = user.data()['live']['convoCount'];
	if(answers[convoCount].toLowerCase() === word.toLowerCase()) {
		await db.collection('users').doc(number).update({
			['live.answerTime']: FieldValue.increment(time)
		});

		if(convoCount === answers.length - 1) {
			// WIN
			sendMessage("Correct!\n\n" + "You got everything correct! We'll let you know if you won soon.");

			await db.collection('users').doc(number).update({
				['live.allCorrect']: true
			});
		}
		else {
			const msg = "Correct! Next Question:\n\n" + questions[convoCount+1];
			sendMessage(msg)
				.then(async (wamid) => {
					wamid = wamid.split('.')[1]
					await db.collection('users').doc(number).update({
						['live.convoCount']: convoCount+1,
						[`live.history.${wamid}.msg`]: msg,
						[`live.wamid`]: wamid,
						['live.acceptAnswer']: true
					});
				})
				.catch((error) => {
      		console.log(error);
      	});
		}
	}
	else {
		sendMessage("WRONG !!! u LOSE");
	}
}

// records the actual time the player was sent the question
// also sets acceptAnswer to true
async function addTimestamp(wamid, timestamp, number=phoneNumber) {
	const user = await db.collection('users').doc(number).get();
	if(whatIsLive(user) === "NONE") return;

  wamid = wamid.split('.')[1];
	// the first message, which is sent via template
	if(user.data()['live']['wamid'] === wamid) {
		await db.collection('users').doc(number).update({
			[`live.history.${wamid}.msgTime`]: timestamp,
			['live.acceptAnswer']: true
		});
		return;
	}

	await db.collection('users').doc(number).update({
		[`live.history.${wamid}.msgTime`]: timestamp
	});
}

module.exports = { setPhoneNumber, checkKeyword, addTimestamp };