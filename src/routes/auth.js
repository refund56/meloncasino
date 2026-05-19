const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/init');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, email, password, balance) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, 1000],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Error creating user' });
      }

      const token = jwt.sign(
        { id: this.lastID, username, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: { id: this.lastID, username, email, balance: 1000 }
      });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, balance: user.balance, role: user.role }
    });
  });
});

// Get user profile
router.get('/profile', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    db.get('SELECT id, username, email, balance, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    });
  });
});

module.exports = router;
