const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  handleValidationErrors,
  idParamValidation,
} = require("../middleware/validation");
const {
  getProjectGroups,
  createProjectGroup,
  updateProjectGroup,
  deleteProjectGroup,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// Project Groups Routes

// GET /project-groups - Get all project groups (requires authentication)
router.get("/project-groups", requireAuth, getProjectGroups);

// Admin-only project group routes
router.post(
  "/project-groups",
  requireAuth,
  requireAdmin,
  [
    body("name")
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Project group name is required and must be less than 100 characters"
      )
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters")
      .trim(),
  ],
  handleValidationErrors,
  createProjectGroup
);

router.put(
  "/project-groups/:id",
  requireAuth,
  requireAdmin,
  idParamValidation,
  [
    body("name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Project group name must be less than 100 characters")
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters")
      .trim(),
  ],
  handleValidationErrors,
  updateProjectGroup
);

router.delete(
  "/project-groups/:id",
  requireAuth,
  requireAdmin,
  idParamValidation,
  handleValidationErrors,
  deleteProjectGroup
);

// Projects Routes

// GET /projects - Get all projects
router.get("/", requireAuth, getProjects);

// GET /projects/:id - Get project by ID
router.get(
  "/:id",
  requireAuth,
  idParamValidation,
  handleValidationErrors,
  getProjectById
);

// Admin-only project routes
router.post(
  "/",
  requireAuth,
  requireAdmin,
  [
    body("name")
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Project name is required and must be less than 100 characters"
      )
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters")
      .trim(),
    body("projectGroupId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Project group ID must be a positive integer"),
    body("assigned_engineer_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Assigned engineer ID must be a positive integer"),
  ],
  handleValidationErrors,
  createProject
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  idParamValidation,
  [
    body("name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Project name must be less than 100 characters")
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters")
      .trim(),
    body("projectGroupId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Project group ID must be a positive integer"),
  ],
  handleValidationErrors,
  updateProject
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  idParamValidation,
  handleValidationErrors,
  deleteProject
);

module.exports = router;
