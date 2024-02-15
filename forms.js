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






const fs = require('fs').promises;
const path = require('path');
//const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Refer to the Node.js quickstart on how to setup the environment:
// https://developers.google.com/calendar/quickstart/node
// Change the scope to 'https://www.googleapis.com/auth/calendar' and delete any
// stored credentials.

const event = {
  'summary': 'Google I/O 2015',
  'description': 'A chance to hear more about Google\'s developer products.',
  'start': {
    'dateTime': '2024-02-14T16:00:00.000Z'
  },
  'end': {
    'dateTime': '2024-02-14T17:00:00.000Z'
  }
};

async function createEvent(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.data);
  });
}

authorize().then(createEvent).catch(console.error);

