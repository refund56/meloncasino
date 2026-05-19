const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../../casino.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance REAL DEFAULT 1000,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Games history
    db.run(`
      CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        bet_amount REAL NOT NULL,
        winnings REAL NOT NULL,
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        balance_before REAL,
        balance_after REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Admin logs
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        target_user_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(admin_id) REFERENCES users(id)
      )
    `);

    // Create default admin user if not exists
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(
          'INSERT INTO users (username, email, password, balance, role) VALUES (?, ?, ?, ?, ?)',
          ['admin', 'admin@casino.com', hashedPassword, 10000, 'admin'],
          (err) => {
            if (err) console.error('Error creating admin user:', err);
            else console.log('Admin user created successfully');
          }
        );
      }
    });
  });
}

module.exports = db;
