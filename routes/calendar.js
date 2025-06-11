require('dotenv').config();

const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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
  console.log('✅ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.redirect(url);
; // ✅ Now it's inside the route handler
});



router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  console.log('🔁 Received code from Google:', code);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  global.oauthTokens = tokens;

  // 🔐 Print tokens to copy into Railway
  console.log('🔐 Copy this token and store it in Railway as an env var:');
  console.log(JSON.stringify(tokens));

  res.send('✅ Authorization successful! You can close this tab.');
});

// TEMP TEST ROUTE
router.get('/test', (req, res) => {
  res.send('📅 Calendar test route is working!');
});
// GET upcoming events
router.get('/events', async (req, res) => {
  console.log('📅 /events route hit');  // 👈 Add this line here

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;



