const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  handleValidationErrors,
  idParamValidation,
} = require("../middleware/validation");
const {
  createDeployment,
  getDeployments,
  getDeploymentById,
  updateDeployment,
  deleteDeployment,
  getServices,
  getScripts,
  getDeploymentServices,
} = require("../controllers/deploymentController");

// GET /deployments/services - Get distinct services
router.get("/services", requireAuth, getServices);

// GET /deployments/scripts - Get distinct scripts or scripts by deployment ID
router.get("/scripts", requireAuth, getScripts);

// GET /deployments/deployment-services - Get all deployment services
router.get("/deployment-services", requireAuth, getDeploymentServices);

// GET /deployments - Get all deployments
router.get("/", requireAuth, getDeployments);

// GET /deployments/:id - Get deployment by ID
router.get(
  "/:id",
  requireAuth,
  idParamValidation,
  handleValidationErrors,
  getDeploymentById
);

// POST /deployments - Create new deployment
router.post(
  "/",
  requireAuth,
  [
    body("projectId")
      .isInt({ min: 1 })
      .withMessage("Project ID is required and must be a positive integer"),
    body("name")
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Deployment name is required and must be less than 100 characters"
      )
      .trim(),
    body("status")
      .isIn(["pending", "running", "completed", "failed"])
      .withMessage("Status must be pending, running, completed, or failed"),
    body("engineerId")
      .isInt({ min: 1 })
      .withMessage("Engineer ID is required and must be a positive integer"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
  ],
  handleValidationErrors,
  createDeployment
);

// PUT /deployments/:id - Update deployment (admin only)
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  idParamValidation,
  [
    body("projectId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Project ID must be a positive integer"),
    body("name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Deployment name must be less than 100 characters")
      .trim(),
    body("status")
      .optional()
      .isIn(["pending", "running", "completed", "failed"])
      .withMessage("Status must be pending, running, completed, or failed"),
    body("engineerId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Engineer ID must be a positive integer"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
  ],
  handleValidationErrors,
  updateDeployment
);

// DELETE /deployments/:id - Delete deployment (admin only)
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  idParamValidation,
  handleValidationErrors,
  deleteDeployment
);

module.exports = router;
