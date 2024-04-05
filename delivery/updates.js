const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { sendMessage } = require('../messaging/messaging.js');

initializeApp();
const db = getFirestore();

async function postQnA(question, answer, type=questionType) {
  const questionsArray = question.split('\n');
  await db.collection('QnA').doc('questions').update({
    [`${type}`]: questionsArray
  });

  const answersArray = answer.split('\n');
  await db.collection('QnA').doc('answers').update({
		[`${type}`]: answersArray
	});
}

async function removeQnA(type=questionType) {
  await db.collection('QnA').doc('questions').update({
    [`${type}`]: FieldValue.delete()
  });

  await db.collection('QnA').doc('answers').update({
    [`${type}`]: FieldValue.delete()
  });
}

// Function to fetch users in batches
async function doInBatches(todo, batchSize=100) {
  let lastUser = null;

  // Loop until all users are fetched
  while (true) {
    let query = db.collection('users').orderBy('createdAt');

    // If not the first batch, start after the last user from the previous batch
    if (lastUser) {
      query = query.startAfter(lastUser);
    }

    query = query.limit(batchSize);
    const snapshot = await query.get();

    todo(snapshot);

    // Update lastUser for the next iteration
    if (snapshot.size > 0) {
      lastUser = snapshot.docs[snapshot.size - 1];
    } else break;
  }
}

async function sendToBatch(message, batch, type=questionType) {
  batch.forEach(doc => {
    sendMessage(message, 'question', doc.id)
      .then(async (wamid) => {
        await db.collection('users').doc(doc.id).update({
          live: {
            type: type,
            wamid: wamid,
            sentTime: parseInt(Date.now() / 1000),
            convoCount: 0,
            answerTime: 0
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

async function sendToWinners(numWinners) {
  const winners = await db.collection('users')
    .where('live.allCorrect', '==', true)
    .orderBy('live.answerTime')
    .limit(numWinners)
    .get();

  winners.forEach(doc => {
    sendMessage( "You actually won.", "none", doc.id);
  });
}

async function sendAnswers(questions, answers) {
  let message = "Thank you everybody for playing The Text Show!" +
    " Here is an overview of today's answers.";
  
  const questionsArray = question.split('\n');
  const answersArray = answer.split('\n');
  for(let i = 0; i < questionsArray.length; i++) {
    message += "\n\nQ: " + questionsArray[i] + "\nA: " + answersArray[i];
  }
  console.log(message);

  doInBatches((batch) => {
    batch.forEach(doc => {
      sendMessage(message, 'question', doc.id);
    });
  });
}

module.exports = { postQnA, removeQnA, doInBatches, sendToBatch, sendToWinners, sendAnswers }