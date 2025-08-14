const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  runMigrations,
  checkMigrationStatus,
  resetDatabase,
  seedDatabase,
  resetSequences,
  clearAllData,
  addProjectEngineerAssignment,
  resetSequencesForEmptyTables,
  getSequenceInfo,
} = require("../controllers/migrationController");

// Temporary endpoint to make user admin (for testing) - no auth required
router.post("/make-admin", async (req, res) => {
  try {
    const pool = require("../config/database");
    await pool.query("UPDATE users SET role = 'admin' WHERE id = 1");
    res.json({ message: "User 1 is now admin" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply authentication and admin authorization to all other routes
router.use(requireAuth);
router.use(requireAdmin);

// GET /admin/migrate/status - Check migration status
router.get("/status", checkMigrationStatus);

// POST /admin/migrate/run - Run database migrations
router.post("/run", runMigrations);

// POST /admin/migrate/seed - Seed database with initial data
router.post("/seed", seedDatabase);

// POST /admin/migrate/reset - Reset database (dangerous operation)
router.post(
  "/reset",
  [
    body("confirm")
      .equals("RESET_DATABASE")
      .withMessage(
        'Please confirm database reset by sending "RESET_DATABASE" in the confirm field'
      ),
  ],
  handleValidationErrors,
  resetDatabase
);

// POST /admin/migrate/reset-sequences - Reset all auto-increment sequences to start from 1
router.post("/reset-sequences", resetSequences);

// POST /admin/migrate/clear-data - Clear all data but keep structure and reset sequences
router.post(
  "/clear-data",
  [
    body("confirm")
      .equals("CLEAR_ALL_DATA")
      .withMessage(
        'Please confirm data clearing by sending "CLEAR_ALL_DATA" in the confirm field'
      ),
  ],
  handleValidationErrors,
  clearAllData
);

// POST /admin/migrate/add-project-engineer-assignment - Add engineer assignment column to projects
router.post("/add-project-engineer-assignment", addProjectEngineerAssignment);

// POST /admin/migrate/reset-sequences-empty-tables - Reset sequences for empty tables only
router.post("/reset-sequences-empty-tables", resetSequencesForEmptyTables);

// GET /admin/migrate/sequence-info - Get current sequence information
router.get("/sequence-info", getSequenceInfo);

module.exports = router;
