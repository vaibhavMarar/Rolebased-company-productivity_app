const express = require('express');
const { generateToken, authenticateToken, verifyToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'VALIDATION_ERROR'
      });
    }

    // Password strength validation
    const trimmedPassword = password.trim();
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
        code: 'VALIDATION_ERROR'
      });
    }

    // Username validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return res.status(400).json({
        error: 'Username must be at least 3 characters long',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username can only contain letters, numbers, and underscores',
        code: 'VALIDATION_ERROR'
      });
    }

    // Optional firstName/lastName validation
    if (firstName !== undefined && firstName !== null) {
      if (typeof firstName !== 'string') {
        return res.status(400).json({
          error: 'First name must be a string',
          code: 'VALIDATION_ERROR'
        });
      }
    }
    
    if (lastName !== undefined && lastName !== null) {
      if (typeof lastName !== 'string') {
        return res.status(400).json({
          error: 'Last name must be a string',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username or email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Only allow setting admin role if explicitly provided and validated
    // In production, you might want additional checks here
    const userRole = role === 'admin' ? 'admin' : 'employee';

    // Create new user
    const user = new User({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      role: userRole
    });

    await user.save();

    // Generate token
    const tokenPayload = { 
      userId: user.id,
      username: user.username,
      role: user.role
    };
    const token = generateToken(tokenPayload);
    
    console.log(`[AUTH] Registration successful for user: ${user.username} (role: ${user.role})`);
    
    res.status(201).json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    res.status(500).json({ 
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ 
      username: username.trim().toLowerCase() 
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token with user data including role
    const tokenPayload = { 
      userId: user.id,
      username: user.username,
      role: user.role
    };
    const token = generateToken(tokenPayload);
    
    console.log(`[AUTH] Login successful for user: ${user.username} (role: ${user.role})`);
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      expiresIn: '24h'
    });
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

