const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const serviceAccount = require('./the-text-show-firebase-adminsdk-7goi3-5b0b5878e8.json');
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore();
//console.log(db.app);
addData();


//console.log('Server authenticated as:', db);//.options.credential._serviceAccountEmail);

async function addData() {
	const snapshot = await db.collection('fart').get();
	snapshot.forEach((doc) => {
	  console.log(doc.id, '=>', doc.data());
	});
}