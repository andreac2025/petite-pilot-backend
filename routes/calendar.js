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

module.exports = router;



