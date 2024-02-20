// Imports the Google Cloud Tasks library.
const {CloudTasksClient} = require('@google-cloud/tasks');

// Instantiates a client.
const client = new CloudTasksClient();

async function createHttpTask() {
  // TODO(developer): Uncomment these lines and replace with your values.
  const project = 'the-text-show';
  const queue = 'tts-send-trigger';
  const location = 'us-central1';
  const url = 'https://2bbd-2600-1700-cbd0-10a0-91b9-b5e9-f1e8-8b0b.ngrok-free.app';
  const payload = 'Hello, World!';
  const inSeconds = 180;

  // Construct the fully qualified queue name.
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      headers: {
        'Content-Type': 'text/plain', // Set content type to ensure compatibility your application's request parsing
      },
      httpMethod: 'POST',
      url,
    },
  };

  if (payload) {
    task.httpRequest.body = Buffer.from(payload).toString('base64');
  }

  if (inSeconds) {
    // The time when the task is scheduled to be attempted.
    task.scheduleTime = {
      seconds: parseInt(inSeconds) + Date.now() / 1000,
    };
  }

  // Send create task request.
  console.log('Sending task:');
  console.log(task);
  const request = {parent: parent, task: task};
  const [response] = await client.createTask(request);
  console.log(`Created task ${response.name}`);
}
createHttpTask();