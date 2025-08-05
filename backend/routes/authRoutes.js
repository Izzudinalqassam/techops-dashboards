const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiting');
const { handleValidationErrors, userRegistrationValidation, userLoginValidation } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken
} = require('../controllers/authController');

// Apply auth rate limiting to all routes
router.use(authLimiter);

// POST /auth/register
router.post('/register', 
  userRegistrationValidation,
  handleValidationErrors,
  register
);

// POST /auth/login
router.post('/login',
  userLoginValidation,
  handleValidationErrors,
  login
);

// POST /auth/logout
router.post('/logout', requireAuth, logout);

// GET /auth/me
router.get('/me', requireAuth, getCurrentUser);

// POST /auth/refresh
router.post('/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  handleValidationErrors,
  refreshToken
);

module.exports = router;