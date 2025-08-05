const rateLimit = require('express-rate-limit');
const config = require('../config/server');
const { logger } = require('../utils/logger');

// Create rate limit middleware factory
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'Too Many Requests', message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.security('Rate limit exceeded', { ip: req.ip, path: req.path });
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General rate limit for all requests
const generalLimiter = createRateLimit(
  config.rateLimiting.windowMs,
  config.rateLimiting.general.max,
  config.rateLimiting.general.message
);

// Strict rate limit for authentication endpoints
const authLimiter = createRateLimit(
  config.rateLimiting.windowMs,
  config.rateLimiting.auth.max,
  config.rateLimiting.auth.message
);

// Moderate rate limit for admin endpoints
const adminLimiter = createRateLimit(
  config.rateLimiting.windowMs,
  config.rateLimiting.admin.max,
  config.rateLimiting.admin.message
);

module.exports = {
  generalLimiter,
  authLimiter,
  adminLimiter,
  createRateLimit
};