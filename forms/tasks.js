// Imports the Google Cloud Tasks library.
const {CloudTasksClient} = require('@google-cloud/tasks');

// Instantiates a client.
const client = new CloudTasksClient();

async function createHttpTaskWithToken() {
  const project = 'the-text-show';
  const queue = 'tts-send-trigger';
  const location = 'us-central1';
  const url = 'https://2bbd-2600-1700-cbd0-10a0-91b9-b5e9-f1e8-8b0b.ngrok-free.app';
  const serviceAccountEmail = 'tasks-service-account@the-text-show.iam.gserviceaccount.com';
  const payload = 'Hello, World!';

  // Construct the fully qualified queue name.
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      headers: {
        'Content-Type': 'text/plain', // Set content type to ensure compatibility your application's request parsing
      },
      httpMethod: 'POST',
      url,
      oidcToken: {
        serviceAccountEmail,
      },
    },
  };

  if (payload) {
    task.httpRequest.body = Buffer.from(payload).toString('base64');
  }

  console.log('Sending task:');
  console.log(task);
  // Send create task request.
  const request = {parent: parent, task: task};
  const [response] = await client.createTask(request);
  const name = response.name;
  console.log(`Created task ${name}`);
}
createHttpTaskWithToken();