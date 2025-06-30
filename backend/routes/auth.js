const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/postgres_db');
const authenticateToken = require('../middlewares/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Signup endpoint
router.post('/signup', async (req, res) => {
  const { email, password, name} = req.body;

  try {
    // Check if user exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, email, name',
      [name, email, hashedPassword]
    );

    // Create token
    const token = jwt.sign(
      {
        user_id: newUser.rows[0].user_id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Signin endpoint
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ user_id: user.rows[0].user_id, email: user.rows[0].email, name: user.rows[0].name}, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      token, 
      user: {
        user_id: user.rows[0].user_id,
        name: user.rows[0].name,
        email: user.rows[0].email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route example
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

// Add this to your auth router
router.post('/verify', authenticateToken, (req, res) => {
  // If middleware passes, token is valid
  res.json({
    valid: true,
    user: req.user,
    email: req.user.email,
    user_id: req.user.user_id,
    name: req.user.name,
    expiresAt: new Date(req.user.exp * 1000)
  });
});

module.exports = router;