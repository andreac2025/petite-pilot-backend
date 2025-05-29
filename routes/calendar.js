// Trigger redeploy for /get-events route
const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI 
);


const SCOPES = ['https://www.googleapis.com/auth/calendar'];

router.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.json({ url });
});

router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Store token globally so it's available later
  global.oauthTokens = tokens;

  res.send('✅ Authorization successful! You can close this tab.');
});


router.post('/create-event', async (req, res) => {  
 // Re-authenticate with stored token
if (global.oauthTokens) {
  oauth2Client.setCredentials(global.oauthTokens);
} else {
  return res.status(401).json({ error: 'Unauthorized: No tokens found' });
}

    try {
    const { title, description, location, startTime, endTime } = req.body;

    // You can log for debugging if needed
    console.log('Creating event:', { title, startTime, endTime });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description,
      location,
      start: {
        dateTime: startTime,
        timeZone: 'America/New_York' // Change to match your audience's main zone
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/New_York'
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

 router.get('/get-events', async (req, res) => {
  if (!global.oauthTokens) {
    return res.status(401).json({ error: 'Unauthorized: No tokens found' });
  }

  const { timeMin, timeMax } = req.query;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  oauth2Client.setCredentials(global.oauthTokens);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
});


module.exports = router;