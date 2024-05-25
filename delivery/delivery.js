const express = require('express');
const { postQnA, doInBatches, sendToBatch, removeQnA, sendToWinners, sendAnswers, sendSchedule } = require('./updates.js');

const app = express();
app.use(express.json()); 

// if we receive something at the webhook endpoint
app.post('/', (req, res) => {
	const event = req.body;
  global.questionType = event['type'] // accessible everywhere
  console.log(event);
  
  if(event['phase'] === 'start') {
    postQnA(event['input']['question'], event['input']['answers']);

    // send the message out 1 minute early bc of Whatsapp delay
    const delay = new Date(event['input']['date']) - new Date() - 60000;
    console.log("Start Delay:", delay);
    setTimeout(() => {
      console.log("start delay over");
      doInBatches((batch) => {
        console.log(4);
        sendToBatch(event['description'], batch);
        console.log(7);
      });
    }, delay);
  }
  else if(event['phase'] === 'stop') {
    removeQnA();
    sendToWinners(event['input']['numWinners'])
      .then(() => {
        sendAnswers(event['input']['question'], event['input']['answers'], questionType);
      });
  }
  else if(event['phase'] === 'schedule') {
    const delay = new Date(event['time']) - new Date() - 60000;
    console.log("Sched Delay:", delay);
    setTimeout(() => {
      console.log("sched delay over");
      doInBatches((batch) => {
        console.log(4);
        sendSchedule(event['description'], batch);
        console.log(7);
      });
    }, delay);
  }

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 9000;
app.listen(port, () => {
  console.log("Delivery Server Started!");
});

