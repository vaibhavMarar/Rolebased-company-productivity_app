const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST create new user (admin only)
router.post('/', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required',
        code: 'MISSING_FIELDS'
      });
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

    // Create new user
    const user = new User({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      role: role === 'admin' ? 'admin' : 'employee',
      permissions: {
        canUpdateTasks: req.body.permissions?.canUpdateTasks || false,
        canDeleteTasks: req.body.permissions?.canDeleteTasks || false
      }
    });

    await user.save();

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    res.status(500).json({ 
      error: 'Failed to create user',
      code: 'CREATE_ERROR'
    });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { username, email, firstName, lastName, role, password, permissions } = req.body;
    const updateData = {};

    // Only include fields that are provided
    if (username !== undefined) updateData.username = username.trim().toLowerCase();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (firstName !== undefined) updateData.firstName = firstName?.trim();
    if (lastName !== undefined) updateData.lastName = lastName?.trim();
    if (role !== undefined) updateData.role = role === 'admin' ? 'admin' : 'employee';
    if (password !== undefined) updateData.password = password;
    if (permissions !== undefined) {
      updateData.permissions = {
        canUpdateTasks: permissions.canUpdateTasks || false,
        canDeleteTasks: permissions.canDeleteTasks || false
      };
    }

    // Check if username or email conflicts with existing user
    if (updateData.username || updateData.email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.params.id },
        $or: [
          updateData.username ? { username: updateData.username } : {},
          updateData.email ? { email: updateData.email } : {}
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username or email already exists',
          code: 'USER_EXISTS'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    // Prevent deleting yourself
    if (String(req.params.id) === req.user.userId) {
      return res.status(400).json({ 
        error: 'You cannot delete your own account',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully', user: { id: user.id, username: user.username } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

