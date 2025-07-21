const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');

const { 
  changePassword,
  getUserProfile,
  deleteUserAccount
} = require('../services/userService');

router.put('/changePassword', authenticateToken, async (req, res) => {
  const { user_id } = req.user;
  const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    try {
      await changePassword(user_id, currentPassword, newPassword);
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: err.message || 'Failed to change password' });
    }
});

router.get('/profile', authenticateToken, async (req, res) => {
  const { user_id } = req.user;

  try {
    // Fetch user profile details from the database
    const userProfile = await getUserProfile(user_id);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userProfile);
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.delete('/deleteAccount', authenticateToken, async (req, res) => {
  const { user_id } = req.user;

  try {
    // Delete user account from the database
    await deleteUserAccount(user_id);
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;