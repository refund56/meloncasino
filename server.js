require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./src/database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/games', require('./src/routes/games'));
app.use('/api/admin', require('./src/routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Casino API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Casino application running on http://localhost:${PORT}`);
});
