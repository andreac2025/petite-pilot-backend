require('dotenv').config();
if (process.env.OAUTH_TOKENS) {
  global.oauthTokens = JSON.parse(process.env.OAUTH_TOKENS);
}

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 Register your route file HERE
const calendarRoutes = require('./routes/calendar');
app.use('/calendar', calendarRoutes);

// ✅ Optional test to verify home route works
app.get('/', (req, res) => {
  res.send('✅ The Petite Pilot backend is up and running without /calendar for now!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


