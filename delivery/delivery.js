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
  console.log(req.body);
  postAnswer(req.body);

  const delay = new Date(req.body['input']['date']) - new Date();
  setTimeout(() => {
  	console.log("Waited " + delay + " seconds for this.");
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

initializeApp();
const db = getFirestore();

async function postAnswer(question) {
	const type = question['type'];
	const answer = question['input']['answers'];

  await db.collection('answers').doc('answers').update({
		[`answers.${type}`]: answer
	});
}
