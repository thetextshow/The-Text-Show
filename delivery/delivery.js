const express = require('express');

const app = express();
app.use(express.json()); 

// for webhook verification from Meta
app.get('/', (req, res) => {
  console.log(req);
  res.sendStatus(200);
});

// if we receive something at the webhook endpoint
app.post('/', (req, res) => {
	const event = req.body;
  console.log(event);
  global.type = event['type'] // accessible everywhere
  postAnswer(event['input']['answers']);

  const delay = new Date(event['input']['date']) - new Date();
  setTimeout(() => {
  	fetchUsersInBatches(event['description']);
  }, delay);

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log("Delivery Server Started!");
});

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const sendMessage = require('../index/messaging.js');

initializeApp();
const db = getFirestore();

async function postAnswer(answer) {
  await db.collection('answers').doc('answers').update({
		[`answers.${type}`]: answer
	});
}


// Function to fetch users in batches
async function fetchUsersInBatches(message, batchSize=100) {
  let lastUser = null;
  let totalUsersProcessed = 0;

  // Loop until all users are fetched
  while (true) {
    let query = db.collection('users').orderBy('createdAt');

    // If not the first batch, start after the last user from the previous batch
    if (lastUser) {
      query = query.startAfter(lastUser);
    }

    query = query.limit(batchSize);
    const snapshot = await query.get();

    snapshot.forEach(async doc => {

      const wamid = sendMessage("question", message, doc.id);
      await doc.update({
      	['live.type']: type,
      	['live.wamid']: wamid,
      	['live.sentTime']: Date().now()
      });
      totalUsersProcessed++;
    });

    // Update lastUser for the next iteration
    if (snapshot.size > 0) {
      lastUser = snapshot.docs[snapshot.size - 1];
    } else break;
  }
}

