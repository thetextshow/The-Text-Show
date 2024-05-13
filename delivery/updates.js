const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { sendMessage } = require('../messaging/messaging.js');
const { MSG } = require('../messaging/MSG.js');

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
  console.log(1);
  if(process.env.dev) {
    console.log(2);
    const user = await db.collection('users').doc(process.env.dev).get();
    console.log(3);
    todo([user]);
    console.log(8);
    return;
  }
  
  let lastUser = null;

  // Loop until all users are fetched
  while (true) {
    let query = db.collection('users').orderBy('createdAt');

    // If not the first batch, start after the last user from the previous batch
    if (lastUser) {
      query = query.startAfter(lastUser);
    }

    query = query.limit(batchSize);
    console.log(2);
    const snapshot = await query.get();
    console.log(3);
    todo(snapshot);
    console.log(8);
    // Update lastUser for the next iteration
    if (snapshot.size > 0) {
      lastUser = snapshot.docs[snapshot.size - 1];
    } else break;
  }
}

async function sendToBatch(message, batch, type=questionType) {
  console.log(5);
  batch.forEach(doc => {
    sendMessage(message, doc.id, 'question')
      .then(async (wamid) => {
        wamid = wamid.split('.')[1]
        await db.collection('users').doc(doc.id).update({
          live: {
            type: type,
            wamid: wamid,
            convoCount: 0,
            answerTime: 0,
            acceptAnswer: false,
            history: {
              [`${wamid}`]: {
                msg: message
              }
            }
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  });
  console.log(6);
}

async function sendToWinners(numWinners) {
  const winners = await db.collection('users')
    .where('live.allCorrect', '==', true)
    .orderBy('live.answerTime')
    .limit(numWinners)
    .get();

  winners.forEach(doc => {
    sendMessage(MSG.WON, doc.id);
  });
}

async function sendAnswers(questions, answers, type=questionType) {
  if(type === "PAID") {
    let message = "Thank you everybody for playing The Text Show!" +
      " Here is an overview of today's answers.";
    
    const questionsArray = questions.split('\n');
    const answersArray = answers.split('\n');
    for(let i = 0; i < questionsArray.length; i++) {
      message += "\r\rQ: " + questionsArray[i] + "\rA: " + answersArray[i];
    }
    console.log(message);

    doInBatches((batch) => {
      batch.forEach(doc => {
        sendMessage(message, doc.id, 'question')
          .then(async () => {
            await db.collection('users').doc(doc.id).update({
              live: FieldValue.delete()
            });
          });
      });
    });
  }
  else if(type === "FREE") {
    doInBatches((batch) => {
      batch.forEach(async (doc) => {
        await db.collection('users').doc(doc.id).update({
          live: FieldValue.delete()
        });
      });
    });
  }
}

function sendSchedule(message, batch) {
  console.log(5);
  batch.forEach(doc => {
    sendMessage(message, doc.id, 'question');
  });
  console.log(6);
}

module.exports = { postQnA, removeQnA, doInBatches, sendToBatch, sendToWinners, sendAnswers, sendSchedule }