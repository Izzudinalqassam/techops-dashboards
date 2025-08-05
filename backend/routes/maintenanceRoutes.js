const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { handleValidationErrors, idParamValidation } = require('../middleware/validation');
const {
  getMaintenanceRequests,
  getMaintenanceStats,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  updateMaintenanceStatus,
  getWorkLogs,
  addWorkLog,
  getStatusHistory
} = require('../controllers/maintenanceController');

// Apply authentication to all routes
router.use(requireAuth);

// GET /admin/maintenance - Get all maintenance requests
router.get('/', getMaintenanceRequests);

// GET /admin/maintenance/stats - Get maintenance statistics
router.get('/stats', getMaintenanceStats);

// GET /admin/maintenance/:id - Get maintenance request by ID
router.get('/:id',
  idParamValidation,
  handleValidationErrors,
  getMaintenanceRequestById
);

// GET /admin/maintenance/:id/work-logs - Get work logs for maintenance request
router.get('/:id/work-logs',
  idParamValidation,
  handleValidationErrors,
  getWorkLogs
);

// GET /admin/maintenance/:id/status-history - Get status history for maintenance request
router.get('/:id/status-history',
  idParamValidation,
  handleValidationErrors,
  getStatusHistory
);

// POST /admin/maintenance - Create maintenance request
router.post('/',
  [
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters')
      .trim(),
    body('description')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Description is required and must be less than 2000 characters')
      .trim(),
    body('priority')
      .isIn(['Low', 'Medium', 'High', 'Critical'])
      .withMessage('Priority must be Low, Medium, High, or Critical'),
    body('assignedTo')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Assigned to must be a valid user ID'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be a valid ISO 8601 date'),
    body('estimatedDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated duration must be a positive integer (minutes)'),
    body('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Category must be less than 50 characters')
      .trim(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each tag must be between 1 and 30 characters')
      .trim(),
    body('affectedSystems')
      .optional()
      .isArray()
      .withMessage('Affected systems must be an array'),
    body('affectedSystems.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each affected system must be between 1 and 50 characters')
      .trim(),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
      .trim()
  ],
  handleValidationErrors,
  createMaintenanceRequest
);

// Admin-only routes
router.use(requireAdmin);

// PUT /admin/maintenance/:id - Update maintenance request
router.put('/:id',
  idParamValidation,
  [
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be less than 200 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Description must be less than 2000 characters')
      .trim(),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Critical'])
      .withMessage('Priority must be Low, Medium, High, or Critical'),
    body('assignedTo')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Assigned to must be a valid user ID'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be a valid ISO 8601 date'),
    body('estimatedDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated duration must be a positive integer (minutes)'),
    body('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Category must be less than 50 characters')
      .trim(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each tag must be between 1 and 30 characters')
      .trim(),
    body('affectedSystems')
      .optional()
      .isArray()
      .withMessage('Affected systems must be an array'),
    body('affectedSystems.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each affected system must be between 1 and 50 characters')
      .trim(),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
      .trim()
  ],
  handleValidationErrors,
  updateMaintenanceRequest
);

// DELETE /admin/maintenance/:id - Delete maintenance request
router.delete('/:id',
  idParamValidation,
  handleValidationErrors,
  deleteMaintenanceRequest
);

// PUT /admin/maintenance/:id/status - Update maintenance status
router.put('/:id/status',
  idParamValidation,
  [
    body('status')
      .isIn(['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold'])
      .withMessage('Status must be Open, In Progress, Completed, Cancelled, or On Hold'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters')
      .trim(),
    body('completedDate')
      .optional()
      .isISO8601()
      .withMessage('Completed date must be a valid ISO 8601 date'),
    body('actualDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Actual duration must be a positive integer (minutes)')
  ],
  handleValidationErrors,
  updateMaintenanceStatus
);

// POST /admin/maintenance/:id/work-logs - Add work log
router.post('/:id/work-logs',
  idParamValidation,
  [
    body('description')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description is required and must be less than 1000 characters')
      .trim(),
    body('hoursWorked')
      .optional()
      .isFloat({ min: 0.1, max: 24 })
      .withMessage('Hours worked must be between 0.1 and 24'),
    body('workDate')
      .optional()
      .isISO8601()
      .withMessage('Work date must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  addWorkLog
);

module.exports = router;