const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { mapUserToFrontend } = require("../utils/userMapper");
const { logger } = require("../utils/logger");

// Get engineers list - all active users can be engineers
const getEngineers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM users WHERE role IN ('admin', 'user') ORDER BY first_name, last_name"
    );

    const engineers = result.rows.map(mapUserToFrontend);

    logger.info("Engineers fetched", { count: engineers.length });

    // Return direct array for frontend compatibility
    res.json(engineers);
  } catch (error) {
    logger.error("Get engineers error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch engineers",
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, first_name, last_name, role, created_at, updated_at, last_login FROM users ORDER BY created_at DESC"
    );

    const users = result.rows.map(mapUserToFrontend);

    res.json({
      users,
      total: users.length,
    });
  } catch (error) {
    logger.error("Get all users error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch users",
    });
  }
};

// Get user statistics (admin only)
const getUserStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'engineer' THEN 1 END) as engineer_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
        COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      totalUsers: parseInt(stats.total_users),
      adminCount: parseInt(stats.admin_count),
      engineerCount: parseInt(stats.engineer_count),
      userCount: parseInt(stats.user_count),
      activeUsers30d: parseInt(stats.active_users_30d),
      newUsers30d: parseInt(stats.new_users_30d),
    });
  } catch (error) {
    logger.error("Get user stats error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch user statistics",
    });
  }
};

// Get specific user (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT id, username, email, first_name, last_name, role, created_at, updated_at, last_login FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    const user = mapUserToFrontend(result.rows[0]);

    res.json({ user });
  } catch (error) {
    logger.error("Get user by ID error", error, { userId: req.params.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch user",
    });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, role } = req.body;

    // Validate role (accept both capitalized and lowercase, convert to lowercase for database)
    const validRoles = ["admin", "user"];
    const normalizedRole = role.toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Role must be Admin or User",
      });
    }

    // Check for existing user
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: "User with this email or username already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user (convert role to lowercase for database storage)
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, first_name, last_name, username, email, role, created_at, updated_at`,
      [firstName, lastName, username, email, hashedPassword, normalizedRole]
    );

    const newUser = mapUserToFrontend(result.rows[0]);
    logger.info("User created by admin", {
      newUserId: newUser.id,
      adminId: req.user.id,
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    logger.error("Create user error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create user",
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, email, role } = req.body;

    // Validate role (accept both capitalized and lowercase, convert to lowercase for database)
    const validRoles = ["admin", "user"];
    const normalizedRole = role ? role.toLowerCase() : null;
    if (role && !validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Role must be Admin or User",
      });
    }

    // Check if user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      id,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Check for email/username conflicts (excluding current user)
    if (email || username) {
      const conflictCheck = await pool.query(
        "SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3",
        [email || "", username || "", id]
      );

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({
          error: "Conflict",
          message: "Another user with this email or username already exists",
        });
      }
    }

    // Update user (convert role to lowercase for database storage)
    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           username = COALESCE($3, username),
           email = COALESCE($4, email),
           role = COALESCE($5, role),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, first_name, last_name, username, email, role, created_at, updated_at, last_login`,
      [firstName, lastName, username, email, normalizedRole, id]
    );

    const updatedUser = mapUserToFrontend(result.rows[0]);
    logger.info("User updated by admin", { userId: id, adminId: req.user.id });

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Update user error", error, {
      userId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update user",
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Cannot delete your own account",
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    const userToDelete = userCheck.rows[0];

    // TODO: Add dependency checking once we confirm the correct column names
    // For now, allow deletion without dependency checking to test basic functionality

    // Delete user
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    logger.info("User deleted by admin", {
      deletedUserId: id,
      deletedUserEmail: userToDelete.email,
      adminId: req.user.id,
    });

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Delete user error", error, {
      userId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete user",
    });
  }
};

// Change user password (admin only)
const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      id,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, id]
    );

    logger.info("User password changed by admin", {
      userId: id,
      adminId: req.user.id,
    });

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error("Change user password error", error, {
      userId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update password",
    });
  }
};

module.exports = {
  getEngineers,
  getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
};
