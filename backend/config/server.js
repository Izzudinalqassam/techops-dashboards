// Server configuration
const config = {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "045b4ae41f95ab775f94e3013bb7fa0cd7e47242d8773bd7533a193b476199e8",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h"
  },
  
  // CORS Configuration
  cors: {
    allowedOrigins: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:5174', // Vite dev server (alternative port)
      'http://localhost:3000', // Alternative dev server
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8080',
      // Add production URLs here when deploying
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 hours
  },
  
  // Rate Limiting Configuration
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    general: {
      max: 1000,
      message: 'Too many requests from this IP, please try again later.'
    },
    auth: {
      max: 10,
      message: 'Too many authentication attempts, please try again later.'
    },
    admin: {
      max: 100,
      message: 'Too many admin requests, please try again later.'
    }
  },
  
  // Request size limits
  requestLimits: {
    jsonLimit: '10mb',
    urlEncodedLimit: '10mb',
    parameterLimit: 1000
  }
};

// Export individual values for easier importing
module.exports = {
  ...config,
  PORT: config.port,
  CORS_OPTIONS: config.cors,
  REQUEST_SIZE_LIMIT: config.requestLimits.jsonLimit
};