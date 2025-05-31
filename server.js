require('dotenv').config();
if (process.env.OAUTH_TOKENS) {
  global.oauthTokens = JSON.parse(process.env.OAUTH_TOKENS);
}

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your route file
const calendarRoutes = require('./routes/calendar');
// NEW
app.use('/calendar', calendarRoutes);
 // don't change this to '/calendar'

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 🔁 Add this GET route
app.get('/', (req, res) => {
  res.send('🚀 The Petite Pilot backend is up and running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});


