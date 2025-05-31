require('dotenv').config();
if (process.env.OAUTH_TOKENS) {
  global.oauthTokens = JSON.parse(process.env.OAUTH_TOKENS);
}

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Petite Pilot base backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



