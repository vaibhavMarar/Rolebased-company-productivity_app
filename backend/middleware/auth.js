const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Authenticate JWT token middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        } else {
          return res.status(401).json({ 
            error: 'Token verification failed',
            code: 'TOKEN_VERIFICATION_FAILED'
          });
        }
      }

      // Attach user data to request
      req.user = decoded;
      req.token = token;
      next();
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify token without middleware (for token verification endpoint)
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired', code: 'TOKEN_EXPIRED' };
    } else if (err.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token', code: 'INVALID_TOKEN' };
    }
    return { valid: false, error: 'Token verification failed', code: 'VERIFICATION_FAILED' };
  }
};

module.exports = { 
  authenticateToken, 
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};

