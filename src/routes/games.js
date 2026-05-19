const express = require('express');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Blackjack Game
router.post('/blackjack', authenticateToken, (req, res) => {
  const { betAmount } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'Error fetching user' });
    }

    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Simple blackjack logic
    const playerCards = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1];
    const dealerCards = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1];
    
    const playerSum = playerCards.reduce((a, b) => a + b, 0);
    const dealerSum = dealerCards.reduce((a, b) => a + b, 0);

    let result = 'loss';
    let winnings = 0;

    if (playerSum > 21) {
      result = 'bust';
    } else if (dealerSum > 21) {
      result = 'win';
      winnings = betAmount * 2;
    } else if (playerSum > dealerSum) {
      result = 'win';
      winnings = betAmount * 2;
    } else if (playerSum === dealerSum) {
      result = 'push';
      winnings = betAmount;
    }

    const newBalance = user.balance - betAmount + winnings;

    db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating balance' });
      }

      db.run(
        'INSERT INTO game_history (user_id, game_type, bet_amount, winnings, result) VALUES (?, ?, ?, ?, ?)',
        [userId, 'blackjack', betAmount, winnings, result],
        (err) => {
          if (err) console.error('Error recording game:', err);

          res.json({
            result,
            playerCards,
            dealerCards,
            playerSum,
            dealerSum,
            betAmount,
            winnings,
            newBalance
          });
        }
      );
    });
  });
});

// Roulette Game
router.post('/roulette', authenticateToken, (req, res) => {
  const { betAmount, betType, betValue } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'Error fetching user' });
    }

    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Spin the wheel (0-36)
    const spinResult = Math.floor(Math.random() * 37);
    let result = 'loss';
    let winnings = 0;

    if (betType === 'number' && spinResult === parseInt(betValue)) {
      result = 'win';
      winnings = betAmount * 36;
    } else if (betType === 'red' && spinResult > 0 && spinResult <= 18) {
      result = 'win';
      winnings = betAmount * 2;
    } else if (betType === 'black' && spinResult > 18 && spinResult <= 36) {
      result = 'win';
      winnings = betAmount * 2;
    } else if (betType === 'odd' && spinResult % 2 === 1) {
      result = 'win';
      winnings = betAmount * 2;
    } else if (betType === 'even' && spinResult % 2 === 0 && spinResult !== 0) {
      result = 'win';
      winnings = betAmount * 2;
    }

    const newBalance = user.balance - betAmount + winnings;

    db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating balance' });
      }

      db.run(
        'INSERT INTO game_history (user_id, game_type, bet_amount, winnings, result) VALUES (?, ?, ?, ?, ?)',
        [userId, 'roulette', betAmount, winnings, result],
        (err) => {
          if (err) console.error('Error recording game:', err);

          res.json({
            result,
            spinResult,
            betType,
            betValue,
            betAmount,
            winnings,
            newBalance
          });
        }
      );
    });
  });
});

// Slots Game
router.post('/slots', authenticateToken, (req, res) => {
  const { betAmount } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'Error fetching user' });
    }

    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Spin slots
    const symbols = ['🍎', '🍊', '🍋', '🍒', '💎', '7️⃣'];
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

    let result = 'loss';
    let winnings = 0;

    if (reel1 === reel2 && reel2 === reel3) {
      result = 'jackpot';
      winnings = betAmount * 100;
    } else if (reel1 === reel2 || reel2 === reel3) {
      result = 'win';
      winnings = betAmount * 3;
    }

    const newBalance = user.balance - betAmount + winnings;

    db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating balance' });
      }

      db.run(
        'INSERT INTO game_history (user_id, game_type, bet_amount, winnings, result) VALUES (?, ?, ?, ?, ?)',
        [userId, 'slots', betAmount, winnings, result],
        (err) => {
          if (err) console.error('Error recording game:', err);

          res.json({
            result,
            reels: [reel1, reel2, reel3],
            betAmount,
            winnings,
            newBalance
          });
        }
      );
    });
  });
});

// Get game history
router.get('/history', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit || 10;

  db.all(
    'SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching history' });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
