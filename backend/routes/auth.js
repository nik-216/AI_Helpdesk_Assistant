const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middlewares/auth');

const { 
  userExists, 
  addUser 
} = require('../services/authService');

const { createToken } = require('../services/tokenService');

// Signup endpoint
router.post('/signup', async (req, res) => {
  const { email, password, name} = req.body;

  try {
    // Check if user exists
    const exists = await userExists(email);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await addUser(name, email, hashedPassword);

    // Create token
    const token = await createToken(newUser);

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
    const user = await userExists(email);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = await createToken(user);

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

// verifying token
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