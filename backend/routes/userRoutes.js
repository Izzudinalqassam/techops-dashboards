const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  handleValidationErrors,
  idParamValidation,
} = require("../middleware/validation");
const {
  getEngineers,
  getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
} = require("../controllers/userController");

// GET /users/engineers - Get all engineers (authenticated users)
router.get("/engineers", requireAuth, getEngineers);

// Admin-only routes (require authentication first, then admin role)
router.use(requireAuth);
router.use(requireAdmin);

// GET /users - Get all users with pagination and filtering
router.get("/", getAllUsers);

// GET /users/stats - Get user statistics
router.get("/stats", getUserStats);

// GET /users/:id - Get user by ID
router.get("/:id", idParamValidation, handleValidationErrors, getUserById);

// POST /users - Create new user
router.post(
  "/",
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("firstName")
      .isLength({ min: 1, max: 50 })
      .withMessage("First name is required and must be less than 50 characters")
      .trim(),
    body("lastName")
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name is required and must be less than 50 characters")
      .trim(),
    body("role")
      .isIn(["admin", "user", "Admin", "User"])
      .withMessage("Role must be Admin or User"),
  ],
  handleValidationErrors,
  createUser
);

// PUT /users/:id - Update user
router.put(
  "/:id",
  idParamValidation,
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("firstName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be less than 50 characters")
      .trim(),
    body("lastName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be less than 50 characters")
      .trim(),
    body("role")
      .optional()
      .isIn(["admin", "user", "Admin", "User"])
      .withMessage("Role must be Admin or User"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
  ],
  handleValidationErrors,
  updateUser
);

// DELETE /users/:id - Delete user
router.delete("/:id", idParamValidation, handleValidationErrors, deleteUser);

// PUT /users/:id/password - Change user password
router.put(
  "/:id/password",
  idParamValidation,
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
  ],
  handleValidationErrors,
  changeUserPassword
);

module.exports = router;
