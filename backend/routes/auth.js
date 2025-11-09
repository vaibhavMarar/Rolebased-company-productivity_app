const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Demo user credentials
const DEMO_USER = {
  username: 'demo',
  password: 'demo123'
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === DEMO_USER.username && password === DEMO_USER.password) {
    const token = jwt.sign(
      { username: DEMO_USER.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, username: DEMO_USER.username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;

