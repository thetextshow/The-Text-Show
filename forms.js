const express = require('express');

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

  buildText();

  res.sendStatus(200);
});

// starting the server
const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log('Forms Server Started!\n');
});

function buildText() {
  if(freeInputs['numWinners'] === 1) {
    const freeMessage = freeInputs['question'].concat('\n\n', "Fastest person wins $", 
      freeInputs['prize'], ".");
    console.log(freeMessage);
  }
  else {
    const freeMessage = freeInputs['question'].concat('\n\n', "Fastest ", 
      freeInputs['numWinners'], " people win $", freeInputs['prize'], " each.");
    console.log(freeMessage);
  }
  
  if(paidInputs['numWinners'] === 1) {
    const paidMessage = paidInputs['question'].concat('\n\n', "Fastest person wins $", 
      paidInputs['prize'], ".");
    console.log(paidMessage);
  }
  else {
    const paidMessage = paidInputs['question'].concat('\n\n', "Fastest ", 
      paidInputs['numWinners'], " people win $", paidInputs['prize'], " each.");
    console.log(paidMessage);
  }
}