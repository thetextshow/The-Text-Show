const express = require('express');
const addToCalendar = require('./calendar.js');

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

// for generic GET requests
app.get('/', (req, res) => {
  console.log("GET\n" + req);
  res.sendStatus(200);
});

// if a form is submitted with the correct endpoint
app.post('/', (req, res) => {
  req.body.fields.forEach((input) => {
    inputs[input.id] = input.value ? input.value : "";
  });

  
  Object.keys(freeKeys).forEach((key) => {
    freeInputs[key] = inputs[freeKeys[key]];
  });
  console.log("--- Free Keys ---");
  console.log(freeInputs);

  
  Object.keys(paidKeys).forEach((key) => {
    paidInputs[key] = inputs[paidKeys[key]];
  });
  console.log("\n\n--- Paid Keys ---");
  console.log(paidInputs);

  const freeEvent = buildText(freeInputs, 'Free');
  addToCalendar(freeEvent);

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 3000;
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


