const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { generateToken } = require("../utils/jwt");
const { sanitizeUser } = require("../utils/userMapper");
const { logger } = require("../utils/logger");

// User registration
const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Additional manual validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Invalid email format",
      });
    }

    // Check for existing user
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      logger.security("Registration failed - User already exists", {
        email,
        username,
        ip: clientIP,
      });
      return res.status(409).json({
        error: "Registration Failed",
        message: "User with this email or username already exists",
      });
    }

    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'user', NOW(), NOW())
       RETURNING id, first_name, last_name, username, email, role, created_at, updated_at`,
      [firstName, lastName, username, email, hashedPassword]
    );

    const newUser = result.rows[0];
    logger.info("User registered successfully", {
      userId: newUser.id,
      email,
      ip: clientIP,
    });

    // Generate token for auto-login
    const token = generateToken(newUser);

    res.status(201).json({
      message: "Registration successful",
      user: sanitizeUser(newUser),
      token,
    });
  } catch (error) {
    logger.error("Registration error", error, { ip: req.ip });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Registration failed",
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Get user from database
    const result = await pool.query(
      "SELECT id, first_name, last_name, username, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      logger.security("Login failed - User not found", { email, ip: clientIP });
      return res.status(401).json({
        error: "Authentication Failed",
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.security("Login failed - Invalid password", {
        userId: user.id,
        email,
        ip: clientIP,
      });
      return res.status(401).json({
        error: "Authentication Failed",
        message: "Invalid email or password",
      });
    }

    // Update last login timestamp
    await pool.query(
      "UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1",
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    logger.info("User logged in successfully", {
      userId: user.id,
      email,
      ip: clientIP,
    });

    res.json({
      message: "Login successful",
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    logger.error("Login error", error, { ip: req.ip });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Login failed",
    });
  }
};

// User logout
const logout = (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    logger.info("User logged out", { userId: req.user?.id, ip: clientIP });

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error", error, { userId: req.user?.id, ip: req.ip });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Logout failed",
    });
  }
};

// Get current user info
const getCurrentUser = (req, res) => {
  try {
    res.json({
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    logger.error("Get current user error", error, { userId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get user information",
    });
  }
};

// Refresh token
const refreshToken = (req, res) => {
  try {
    const token = generateToken(req.user);

    res.json({
      message: "Token refreshed successfully",
      token,
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    logger.error("Token refresh error", error, { userId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Token refresh failed",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
};
