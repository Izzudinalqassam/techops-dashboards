const pool = require("../config/database");
const { verifyToken } = require("../utils/jwt");
const { logger } = require("../utils/logger");

// Enhanced Authentication middleware with security logging
const requireAuth = async (req, res, next) => {
  try {
    // Authentication check

    const authHeader = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Auth failed: No bearer token");
      logger.security("Authentication failed - No token provided", {
        ip: clientIP,
        path: req.path,
      });
      return res.status(401).json({
        error: "Authentication Required",
        message: "Please provide a valid authentication token",
      });
    }

    const token = authHeader.substring(7);

    // Validate token format
    if (!token || token.length < 10) {
      logger.security("Authentication failed - Invalid token format", {
        ip: clientIP,
      });
      return res.status(401).json({
        error: "Authentication Failed",
        message: "Invalid token format",
      });
    }

    const decoded = verifyToken(token);

    // Get user from database with additional security checks
    const result = await pool.query(
      "SELECT id, first_name, last_name,username, email, role, created_at, updated_at FROM users WHERE id = $1 AND role IS NOT NULL",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      logger.security("Authentication failed - User not found or inactive", {
        userId: decoded.userId,
        ip: clientIP,
      });
      return res.status(401).json({
        error: "Authentication Failed",
        message: "User not found or account inactive",
      });
    }

    const user = result.rows[0];

    // Additional security: Check if user role is valid
    const validRoles = ["admin", "user", "engineer"];
    if (!validRoles.includes(user.role)) {
      logger.security("Authentication failed - Invalid user role", {
        userId: user.id,
        role: user.role,
        ip: clientIP,
      });
      return res.status(403).json({
        error: "Access Denied",
        message: "Invalid user role",
      });
    }

    req.user = user;
    req.clientIP = clientIP;
    next();
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (error.name === "JsonWebTokenError") {
      logger.security("Authentication failed - Invalid JWT", {
        ip: clientIP,
        error: error.message,
      });
      return res.status(401).json({
        error: "Authentication Failed",
        message: "Invalid authentication token",
      });
    }
    if (error.name === "TokenExpiredError") {
      logger.security("Authentication failed - Expired JWT", { ip: clientIP });
      return res.status(401).json({
        error: "Authentication Failed",
        message: "Authentication token has expired",
      });
    }

    logger.error("Authentication error", error, { ip: clientIP });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication error",
    });
  }
};

// Enhanced Admin middleware with comprehensive role checking
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.security("Admin access denied - No user in request", {
        ip: req.clientIP,
      });
      return res.status(401).json({
        error: "Authentication Required",
        message: "Authentication required for admin access",
      });
    }

    // Check for admin role (case-insensitive to handle different database schemas)
    const userRole = req.user.role?.toLowerCase();
    if (userRole !== "admin") {
      logger.security("Admin access denied - Insufficient privileges", {
        userId: req.user.id,
        role: req.user.role,
        ip: req.clientIP,
        path: req.path,
      });
      return res.status(403).json({
        error: "Access Denied",
        message: "Administrator privileges required",
      });
    }

    next();
  } catch (error) {
    logger.error("Admin middleware error", error, {
      userId: req.user?.id,
      ip: req.clientIP,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authorization error",
    });
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.security("Role access denied - No user in request", {
          ip: req.clientIP,
        });
        return res.status(401).json({
          error: "Authentication Required",
          message: "Authentication required",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.security("Role access denied - Insufficient role", {
          userId: req.user.id,
          role: req.user.role,
          required: allowedRoles.join(","),
          ip: req.clientIP,
          path: req.path,
        });
        return res.status(403).json({
          error: "Access Denied",
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      next();
    } catch (error) {
      logger.error("Role middleware error", error, {
        userId: req.user?.id,
        ip: req.clientIP,
      });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Authorization error",
      });
    }
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireRole,
};
