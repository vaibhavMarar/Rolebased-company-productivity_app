const express = require('express');
const { generateToken, authenticateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Demo user credentials (In production, store in MongoDB)
const DEMO_USER = {
  username: 'demo',
  password: 'demo123'
};

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Check credentials
    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      // Generate token with user data
      const token = generateToken({ 
        username: DEMO_USER.username,
        userId: 'demo-user-id' // In production, use actual user ID from database
      });
      
      res.json({ 
        token, 
        user: {
          username: DEMO_USER.username
        },
        expiresIn: '24h'
      });
    } else {
      res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  try {
    res.json({ 
      valid: true,
      user: req.user,
      message: 'Token is valid'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Token verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Verify token without authentication (public endpoint)
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required',
        code: 'NO_TOKEN'
      });
    }

    const result = verifyToken(token);
    
    if (result.valid) {
      res.json({ 
        valid: true,
        user: result.decoded,
        message: 'Token is valid'
      });
    } else {
      res.status(401).json({ 
        valid: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Token verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Logout endpoint (client-side handles token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // In a more advanced setup, you could blacklist the token
  // For now, we just return success (client removes token from localStorage)
  res.json({ 
    message: 'Logged out successfully'
  });
});

module.exports = router;

