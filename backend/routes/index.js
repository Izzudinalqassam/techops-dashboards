const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const projectRoutes = require("./projectRoutes");
const deploymentRoutes = require("./deploymentRoutes");
const maintenanceRoutes = require("./maintenanceRoutes");
const migrationRoutes = require("./migrationRoutes");

// Health check endpoint (no authentication required)
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Mount routes with their respective prefixes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
// Engineers route - direct endpoint
const { getEngineers } = require("../controllers/userController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  handleValidationErrors,
  idParamValidation,
} = require("../middleware/validation");
const { body } = require("express-validator");
router.get("/engineers", requireAuth, getEngineers);
router.use("/projects", projectRoutes);
router.use("/deployments", deploymentRoutes);

// Mount project groups routes - these need to be accessible at /api/project-groups
const {
  getProjectGroups,
  createProjectGroup,
  updateProjectGroup,
  deleteProjectGroup,
} = require("../controllers/projectController");

// Project Groups Routes at /api/project-groups
router.get("/project-groups", requireAuth, getProjectGroups);

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
router.use("/admin/maintenance", maintenanceRoutes);
router.use("/admin/migrate", migrationRoutes);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    name: "TechOps Dashboard API",
    version: "1.0.0",
    description: "Backend API for TechOps Dashboard application",
    endpoints: {
      auth: "/auth",
      users: "/users",
      projects: "/projects",
      deployments: "/deployments",
      maintenance: "/admin/maintenance",
      migrations: "/admin/migrate",
      health: "/health",
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
