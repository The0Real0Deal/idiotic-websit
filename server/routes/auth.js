const express = require('express');
const router = express.Router();
const { UserManager, TokenManager } = require('../utils/dataManager');
const { authMiddleware } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const user = UserManager.createUser(username, email, password);
    const token = TokenManager.generateToken(user.id);
    
    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = UserManager.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isPasswordValid = UserManager.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = TokenManager.generateToken(user.id);
    
    res.json({
      message: 'Login successful',
      user: { ...user, password: undefined },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user
  });
});

// Change password
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const isCurrentPasswordValid = UserManager.verifyPassword(currentPassword, req.user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    UserManager.updatePassword(req.user.id, newPassword);
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
