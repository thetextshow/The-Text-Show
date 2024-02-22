const {google} = require('googleapis');
const calendar = google.calendar('v3');

async function addToCalendar(event) {
  const auth = new google.auth.GoogleAuth({
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  });

  // Acquire an auth client, and bind it to all future calls
  const authClient = await auth.getClient();
  google.options({auth: authClient});

  // Do the magic
  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
  console.log(res.data);

  // Do the magic
  const res2 = await calendar.calendarList.list();
  console.log(res2.data);
}

module.exports = addToCalendar;