require('dotenv').config({path: './forms/.env.forms'});
// Imports the Google Cloud Tasks library.
const {CloudTasksClient} = require('@google-cloud/tasks');

// Instantiates a client.
const client = new CloudTasksClient({ fallback: true });

async function createHttpTask(event, seconds) {
  const project = 'the-text-show';
  const queue = 'tts-send-trigger';
  const location = 'us-central1';
  const url = process.env.DELIVERY_URL;
  const payload = event;

  // Construct the fully qualified queue name.
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      headers: {
        'Content-Type': 'application/json',
      },
      httpMethod: 'POST',
      url,
    },
  };

  if (payload) {
    task.httpRequest.body = Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  if (seconds) {
    // The time when the task is scheduled to be attempted.
    task.scheduleTime = {
      seconds: parseInt(seconds),
    };
  }

  // Send create task request.
  console.log('Sending task:');
  console.log(task);
  const request = {parent: parent, task: task};
  const [response] = await client.createTask(request);
  console.log(`Created task ${response.name}`);
}

module.exports = createHttpTask;