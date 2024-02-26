const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const sendMessage = require('../messaging/messaging.js');

initializeApp();
const db = getFirestore();

async function postAnswer(answer, type=questionType) {
  await db.collection('answers').doc('answers').update({
		answers: {
			[`${type}`]: answer
		}
	});
}

// Function to fetch users in batches
async function sendToUsers(message, type=questionType, batchSize=100) {
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

    snapshot.forEach(doc => {
    	sendMessage(message, 'question', doc.id)
      	.then(async (wamid) => {
		      await db.collection('users').doc(doc.id).update({
		      	live: {
		      		type: type,
		      		wamid: wamid,
		      		sentTime: parseInt(Date.now() / 1000)
		      	}
		      });
      	})
      	.catch((error) => {
      		console.log(error);
      	});
    });

    // Update lastUser for the next iteration
    if (snapshot.size > 0) {
      lastUser = snapshot.docs[snapshot.size - 1];
    } else break;
  }
}

module.exports = { postAnswer, sendToUsers }