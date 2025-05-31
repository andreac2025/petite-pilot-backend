require('dotenv').config();

const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI 
);
// Load stored tokens from file if available
const tokenPath = path.join(__dirname, '../tokens.json');

let savedTokens;

if (process.env.RAILWAY_TOKENS) {
  savedTokens = JSON.parse(process.env.RAILWAY_TOKENS);
  console.log('🔐 Loaded tokens from Railway env var');
}


if (savedTokens) {
  oauth2Client.setCredentials(savedTokens);
  global.oauthTokens = savedTokens;
}


const SCOPES = ['https://www.googleapis.com/auth/calendar'];

router.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    redirect_uri: process.env.REDIRECT_URI, // ✅ Keep this here
  });

  res.json({ url }); // ✅ Now it's inside the route handler
});



router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  global.oauthTokens = tokens;

  // 🔐 Print tokens to copy into Railway
  console.log('🔐 Copy this token and store it in Railway as an env var:');
  console.log(JSON.stringify(tokens));

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

    res.status(200).json({ message: 'Event created successfully!' });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});
console.log('💡 OAuth Tokens:', global.oauthTokens);
// ✏️ Update an existing event by ID
router.patch('/update-event', async (req, res) => {
  const { eventId, summary, description, start, end } = req.body;

  if (!global.oauthTokens) {
    return res.status(401).json({ error: 'Unauthorized: No tokens found' });
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  oauth2Client.setCredentials(global.oauthTokens);

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    res.status(200).json({ message: '✅ Event updated successfully!', event: response.data });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
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

router.get('/get-availability', async (req, res) => {
  if (!global.oauthTokens) {
    return res.status(401).json({ error: 'Unauthorized: No tokens found' });
  }

  const { timeMin, timeMax } = req.query;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  oauth2Client.setCredentials(global.oauthTokens);

  try {
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyTimes = events.data.items.map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    }));

    const availability = [];
    let currentTime = new Date(timeMin);
    const endRange = new Date(timeMax);

    while (currentTime < endRange) {
      const nextHour = new Date(currentTime.getTime() + 60 * 60 * 1000);

      const isBusy = busyTimes.some(event =>
        (currentTime < new Date(event.end)) && (nextHour > new Date(event.start))
      );

      if (!isBusy && nextHour <= endRange) {
        availability.push({
          start: currentTime.toISOString(),
          end: nextHour.toISOString(),
        });
      }

      currentTime = nextHour;
    }

    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

router.get('/get-availability', async (req, res) => {
  if (!global.oauthTokens) {
    return res.status(401).json({ error: 'Unauthorized: No tokens found' });
  }

  const { timeMin, timeMax } = req.query;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  oauth2Client.setCredentials(global.oauthTokens);

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: 'America/New_York',
        items: [{ id: 'primary' }],
      },
    });

    console.log('✅ Availability:', response.data.calendars.primary.busy);
    res.json(response.data.calendars.primary.busy);
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to retrieve availability' });
  }
});

// 🧪 Debug route to test if calendar routes are live
router.get('/test', (req, res) => {
  res.json({ message: '🎯 Calendar routes are working!' });
});

// TEMP TEST ROUTE
router.get('/test', (req, res) => {
  res.send('📅 Calendar test route is working!');
});

module.exports = router;



