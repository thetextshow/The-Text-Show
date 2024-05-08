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

// if a form is submitted with the correct endpoint
app.post('/', (req, res) => {
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

  const paidPrize = paidInputs['numWinners'] === 1 ?
    "Fastest person wins $" + paidInputs['prize'] + "."
    : "Fastest " + paidInputs['numWinners'] + " people win $" + input['prize'] + " each.";
  const dailyIntro = {
    'description': 'Today\'s schedule:\n\n' +
       freeInputs['date'].substr(11, 16) + ": FREE question. Fastest " + freeInputs['numWinners'] +
       " people to answer correctly get to play the $1 question for free!\n\n" +
       paidInputs['date'].substr(11, 16) + ": $1 question. " + paidPrize
  };
  console.log(dailyIntro['description']);
  let date = new Date(freeInputs['date']);
  date = date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  createHttpTask(dailyIntro, date.toISOString());

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log('Forms Server Started!\n');
});

function buildText(input, type) {
  const questions = input['question'].split('\n');

  // different message if it's 1 winner vs multiple winners
  let message = input['numWinners'] === 1 ?
    "Fastest person wins $" + input['prize'] + "."
    : "Fastest " + input['numWinners'] + " people win $" + input['prize'] + " each.";
  message += "\r\r" + questions[0] + "\r\r" + "Only your FIRST answer will be considered.";

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


