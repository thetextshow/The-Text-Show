/**
 * KEYWORDS
 **/

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { setDefaultNumber, sendMessage } = require('../messaging/messaging.js');
const { MSG, format } = require('../messaging/MSG.js');

initializeApp();

const db = getFirestore();
const keywords = {PLAY: "PLAY", HELP: "HELP", STOP: "STOP"};

async function checkKeyword(word, timestamp, number) {
	console.log(number + " said " + word);
	// if the user does not exist, we need them to opt in first
	const user = await db.collection('users').doc(number).get();
	if(!user.exists) {
		if(word === "PLAY") {
			play(false, number);
		}
		else {
			sendMessage(MSG.JOIN, number);
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
			await play(true, number);
			break;
		case 'HELP':
			help(number);
			break;
		case 'STOP':
			await stop(user, number);
			break;
		default:
			const live = await whatIsLive(user, number);
			if(live === "NONE") sendMessage(format(MSG.NOT_KEY, word), number);
			else await handleAnswer(live, user, word, timestamp, number);
	}
}

async function play(userExists=true, number) {
	if(userExists) {
		sendMessage(MSG.PLAY, number);
	}
	else {
		const oldUser = await db.collection('oldUsers').doc(number).get();
		if(oldUser.exists) {
		  await db.collection('users').doc(number).set(oldUser.data());
	   await db.collection('oldUsers').doc(number).delete();
		}
		else {
				await db.collection('users').doc(number).set({
					balance: 0,
					number: number,
					createdAt: FieldValue.serverTimestamp()
				});
		}
		sendMessage(MSG.WELCOME, number);
	}
}

function help(number) {
	sendMessage(MSG.HELP, number);
}

// move the user to a different collection
async function stop(user, number) {
	await db.collection('oldUsers').doc(number).set(user.data());
	await db.collection('users').doc(number).delete();
	sendMessage(MSG.STOP, number);
}

// returns "FREE", "PAID", or "NONE" based on which
// competition is live
async function whatIsLive(user='none', number) {
	if(user === 'none') user = await db.collection('users').doc(number).get();
	return user.data()['live']?.['type'] ? user.data()['live']['type'] : "NONE";
}

// returns true if the player paid for the $1 competition
async function registeredForPaid(number) {
	const user = await db.collection('paid').doc(number).get();
	return user.exists;
}

async function handleAnswer(type, user, word, timestamp, number) {
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
			sendMessage(MSG.ALL_CORRECT, number);

			await db.collection('users').doc(number).update({
				['live.allCorrect']: true
			});
		}
		else {
			const msg = format(MSG.CORRECT, questions[convoCount+1]);
			sendMessage(msg, number)
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
		sendMessage(MSG.WRONG, number);
	}
}

// records the actual time the player was sent the question
// also sets acceptAnswer to true
async function addTimestamp(wamid, timestamp, number) {
	const user = await db.collection('users').doc(number).get();
	const live = await whatIsLive(user);
	if(live === "NONE") return;

  wamid = wamid.split('.')[1];
	// the first message, which is sent via template
	if(user.data()['live']?.['wamid'] === wamid) {
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

module.exports = { checkKeyword, addTimestamp };
