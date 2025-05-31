require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ msg: '✅ Base backend is running' });
});



app.get('/debug', (req, res) => {
  res.json({ msg: '🛠️ Debug route is live!', port: PORT });
});

const PORT = process.env.PORT;


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});






