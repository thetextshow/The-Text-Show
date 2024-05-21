require('dotenv').config({path: './forms/.env.forms'});
const express = require('express');
const addToCalendar = require('./calendar.js');
const createHttpTask = require('./tasks.js');

const app = express();
app.use(express.json()); 

const inputs = {}, freeInputs = {}, paidInputs = {};
const freeKeys = {
  date: '7z2iD1MgJdXw31omoXQfUx',
  answers: 'frW3PwLTLtrTzZwS8Wfzv2',
  question: 'ngg7uJMweeto8qHsQSyUEG',
  prize: 'rN9KczVcEMbEiijcgmnrKx',
  numWinners: 'whTVu1SexJaMWAF3bqYo8T'
};
const paidKeys = {
  date: 'tpJe1fbAnKHf8AbhMsFBGb',
  answers: 'iuiDCbQqk3D5NC8oTw66ki',
  question: 'h15WMmMpDHsUd7tWJEoxB1',
  prize: 'ifkHgkyZGUojizDYUuUyX6',
  numWinners: 'gCBtpGatA1LdjHEAxeHv43'
};
const schedule = 'mnRZqSyfghcnkRBwZPs6FJ';

// if a form is submitted with the correct endpoint
app.post('/', (req, res) => {
  console.log(req.body);
  try {
    let password = false;
    req.body.fields.forEach((input) => {
      if(input.label === "Password" && input.value === process.env.FORM_PASS) {
        password = true;
      }

      inputs[input.id] = input.value ? input.value : "";
    });
    if(!password) {
      console.log("Unathenticated Request Attempted!");
      res.sendStatus(400);
      return;
    }
  }
  catch (e) {
    console.log("Unathenticated Request Attempted!");
    res.sendStatus(400);
    return;
  }
  
  Object.keys(freeKeys).forEach((key) => {
    freeInputs[key] = inputs[freeKeys[key]];
  });
  Object.keys(paidKeys).forEach((key) => {
    paidInputs[key] = inputs[paidKeys[key]];
  });

  scheduleEvent(freeInputs, 'FREE');
  scheduleEvent(paidInputs, 'PAID');

  let freeDate = new Date(freeInputs['date']);
  freeDate = new Date(freeDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const freeDateString = `${freeDate.getHours()}:${String(freeDate.getMinutes()).padStart(2, '0')}`;
  let paidDate = new Date(paidInputs['date']);
  paidDate = new Date(paidDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const paidDateString = `${paidDate.getHours()}:${String(paidDate.getMinutes()).padStart(2, '0')}`;
  const paidPrize = paidInputs['numWinners'] === 1 ?
    "Fastest person wins $" + paidInputs['prize'] + "."
    : "Fastest " + paidInputs['numWinners'] + " people win $" + paidInputs['prize'] + " each.";
  const dailyIntro = {
    'description': 'Today\'s schedule:\r\r' +
       freeDateString + ": FREE question. Fastest " + freeInputs['numWinners'] +
       " people to answer correctly get to play the $1 question for free!\r\r" +
       paidDateString + ": $1 question. " + paidPrize,
    'phase': 'schedule'
  };
  dailyIntro['time'] = inputs[schedule];
  const time = (new Date(dailyIntro['time']).getTime() / 1000);
  createHttpTask(dailyIntro, time - 120);

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log('Forms Server Started!\n');
});

function buildText(input, type) {
  const questions = input['question'].split('\n');
  const message = questions[0];

  // end time is one hour after start time
  const date = new Date(input['date']);
  date.setHours(date.getHours() + 1);
  const end = date.toISOString();

  return {
    'summary': type + ' Question ' + input['date'].substr(5, 5),
    'description': message,
    'start': {
      'dateTime': input['date']
    },
    'end': {
      'dateTime': end
    }
  };
}

function scheduleEvent(input, type) {
  if(input['date'] === "") return;

  const event = buildText(input, type);
  addToCalendar(event);

  // start the task 2 minutes before the message goes out
  const startTime = (new Date(input['date']).getTime() / 1000) - 120;
  // add the original form input
  event['input'] = input;
  event['type'] = type;
  event['phase'] = 'start';
  createHttpTask(event, startTime);

  const stopTime = (new Date(input['date']).getTime() / 1000) + 3600;
  event['phase'] = 'stop';
  createHttpTask(event, stopTime);
}


