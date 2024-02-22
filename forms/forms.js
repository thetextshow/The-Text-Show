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
const paidKeys = { // TODO
  date: '7z2iD1MgJdXw31omoXQfUx',
  answers: 'frW3PwLTLtrTzZwS8Wfzv2',
  question: 'ngg7uJMweeto8qHsQSyUEG',
  prize: 'rN9KczVcEMbEiijcgmnrKx',
  numWinners: 'whTVu1SexJaMWAF3bqYo8T'
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
      res.sendStatus(200);
      return;
    }
  }
  catch {
    console.log("Unathenticated Request Attempted!");
    res.sendStatus(200);
    return;
  }
  
  Object.keys(freeKeys).forEach((key) => {
    freeInputs[key] = inputs[freeKeys[key]];
  });
  Object.keys(paidKeys).forEach((key) => {
    paidInputs[key] = inputs[paidKeys[key]];
  });

  scheduleEvent(freeInputs, 'Free');
  //scheduleEvent(paidInputs, 'Paid');

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log('Forms Server Started!\n');
});

function buildText(input, type) {
  // different message if it's 1 winner vs multiple winners
  const message = input['numWinners'] === 1 ?
    input['question'].concat('\n\n', "Fastest person wins $", input['prize'], ".")
    : input['question'].concat('\n\n', "Fastest ", input['numWinners'], " people win $", input['prize'], " each.");

  // end time is one hour after start time
  const end = input['date'].substr(0, 12)
    + (parseInt(input['date'][12]) + 1).toString()
    + input['date'].substr(13);

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
  console.log(event);
  addToCalendar(event);

  // start the task 2 minutes before the message goes out
  const seconds = (new Date(input['date']).getTime() / 1000) - 120;
  // add the original form input
  event['input'] = input;
  createHttpTask(event, seconds);
}


