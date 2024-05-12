const { google } = require('googleapis');
const { auth } = require('google-auth-library');

async function updateMinInstances(projectId, serviceId, minInstances) {
  // Authenticate using ADC or service account key
  const authClient = await auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  // Create a Cloud Run API client
  const cloudrun = google.run({ version: 'v1', auth: authClient });

  // Make the API request to patch the service configuration
  const res = await cloudrun.projects.locations.services.patch({
    auth: authClient,
    name: `projects/${projectId}/locations/us-central1/services/${serviceId}`,
    updateMask: 'spec.minInstances',
    requestBody: {
      spec: {
        minInstances: minInstances
      }
    }
  });

  console.log('Service updated:', res.data);
}

// Usage
function spinUp() {
  let minInstances = 1;
  updateMinInstances('the-text-show', 'tts-index', minInstances)
    .catch(console.error);
}

function spinDown() {
  updateMinInstances('the-text-show', 'tts-index', 0)
    .catch(console.error);
}

module.exports = { spinUp, spinDown }
