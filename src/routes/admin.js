const express = require('express');
const db = require('../database/init');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, authorizeAdmin, (req, res) => {
  db.all('SELECT id, username, email, balance, role, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching users' });
    }
    res.json(rows);
  });
});

// Get user details
router.get('/users/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const userId = req.params.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    db.all(
      'SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId],
      (err, history) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching game history' });
        }

        res.json({ ...user, gameHistory: history });
      }
    );
  });
});

// Update user balance (admin only)
router.put('/users/:id/balance', authenticateToken, authorizeAdmin, (req, res) => {
  const userId = req.params.id;
  const { newBalance } = req.body;
  const adminId = req.user.id;

  if (typeof newBalance !== 'number' || newBalance < 0) {
    return res.status(400).json({ message: 'Invalid balance value' });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'Error fetching user' });
    }

    db.run('UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newBalance, userId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating balance' });
      }

      db.run(
        'INSERT INTO transactions (user_id, amount, type, description, balance_before, balance_after) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, newBalance - user.balance, 'admin_adjustment', 'Balance adjusted by admin', user.balance, newBalance],
        (err) => {
          if (err) console.error('Error recording transaction:', err);

          db.run(
            'INSERT INTO admin_logs (admin_id, action, target_user_id, description) VALUES (?, ?, ?, ?)',
            [adminId, 'balance_update', userId, `Changed balance from ${user.balance} to ${newBalance}`],
            (err) => {
              if (err) console.error('Error recording admin log:', err);
              res.json({ message: 'Balance updated successfully', newBalance });
            }
          );
        }
      );
    });
  });
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const userId = req.params.id;
  const adminId = req.user.id;

  if (userId === adminId) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting user' });
    }

    db.run(
      'INSERT INTO admin_logs (admin_id, action, target_user_id, description) VALUES (?, ?, ?, ?)',
      [adminId, 'user_deleted', userId, 'User account deleted'],
      (err) => {
        if (err) console.error('Error recording admin log:', err);
        res.json({ message: 'User deleted successfully' });
      }
    );
  });
});

// Get statistics
router.get('/statistics', authenticateToken, authorizeAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as totalUsers FROM users', (err, usersCount) => {
    db.get('SELECT SUM(balance) as totalBalance FROM users', (err, balanceSum) => {
      db.get('SELECT COUNT(*) as totalGames FROM game_history', (err, gamesCount) => {
        db.get('SELECT SUM(winnings) as totalPayouts FROM game_history', (err, payouts) => {
          res.json({
            totalUsers: usersCount.totalUsers,
            totalBalance: balanceSum.totalBalance,
            totalGames: gamesCount.totalGames,
            totalPayouts: payouts.totalPayouts
          });
        });
      });
    });
  });
});

// Get game statistics by type
router.get('/game-stats', authenticateToken, authorizeAdmin, (req, res) => {
  db.all(
    `SELECT game_type, COUNT(*) as count, SUM(bet_amount) as totalBets, 
     SUM(winnings) as totalPayouts, AVG(winnings/bet_amount) as avgMultiplier 
     FROM game_history GROUP BY game_type`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching game statistics' });
      }
      res.json(rows);
    }
  );
});

// Get admin logs
router.get('/logs', authenticateToken, authorizeAdmin, (req, res) => {
  const limit = req.query.limit || 50;

  db.all(
    'SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching admin logs' });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
