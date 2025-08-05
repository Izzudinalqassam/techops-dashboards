const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || '045b4ae41f95ab775f94e3013bb7fa0cd7e47242d8773bd7533a193b476199e8';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateAuthToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Sanitize user data for frontend
const sanitizeUser = (user) => {
  const { password_hash, ...sanitizedUser } = user;
  return {
    ...sanitizedUser,
    id: user.id.toString(),
  };
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateAuthToken,
  sanitizeUser,
};