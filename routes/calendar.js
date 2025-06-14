require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 🔁 Health check route
router.get('/ping', (req, res) => {
  console.log('👋🏽 Ping route hit');
  res.send('pong');
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID.trim(),
  process.env.GOOGLE_CLIENT_SECRET.trim(),
  process.env.REDIRECT_URI.trim()
);
// Use stored refresh token
if (process.env.REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN.trim()
  });
}
// Load stored tokens from file if available
// const tokenPath = path.join(__dirname, '../tokens.json');

// let savedTokens;



// if (savedTokens) {
//  oauth2Client.setCredentials(savedTokens);
//  global.oauthTokens = savedTokens;
//}


const SCOPES = ['https://www.googleapis.com/auth/calendar'];

router.get('/auth', (req, res) => {
  console.log('🔍 ENV CHECK:', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    REDIRECT_URI: process.env.REDIRECT_URI,
  });

  const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

  res.redirect(url);
});



router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  console.log('🔁 Received code from Google:', code);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

 // 🧠 Copy this token and store it in Render as an env var
console.log('🧠 Copy this token and store it in Render as an env var:');
console.log(JSON.stringify(tokens));

  res.send('✅ Authorization successful! You can close this tab.');
});

// TEMP TEST ROUTE
router.get('/events', async (req, res) => {
  console.log('📍 /calendar/events route hit');

  try {
    oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary);
    const calendarId = primaryCalendar.id;

    console.log('👉 Using calendar ID:', calendarId);

    const response = await calendar.events.list({
  calendarId,
  timeMin: new Date().toISOString(),
  maxResults: 20,
  singleEvents: true,
  orderBy: 'startTime',
});

    console.log('‼️ Events returned:', response.data.items.length);
    const events = response.data.items;
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching events:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/list', async (req, res) => {
  console.log('📋 /list route hit');

  try {
    // Set credentials using your refresh token
    oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.calendarList.list();

    const calendars = response.data.items.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
    }));

    res.json(calendars);
  } catch (error) {
    console.error('❌ Error fetching calendar list:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch calendar list' });
  }
});

router.get('/weekly-summary', async (req, res) => {
  console.log('📆 /calendar/weekly-summary route hit');
  try {
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    console.log(`📋 Weekly summary events returned: ${events.length}`);
    res.json(events);
  } catch (error) {
    console.error('🚨 Error fetching weekly summary:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

module.exports = router;



