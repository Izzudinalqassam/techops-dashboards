const pool = require("../config/database");
const { logger } = require("../utils/logger");
const { resetAllSequencesForEmptyTables, getSequenceStatus } = require("../utils/sequenceUtils");

// Run database migrations
const runMigrations = async (req, res) => {
  try {
    logger.info("Starting database migrations", { adminId: req.user.id });

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'engineer')),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create project_groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        project_group_id INTEGER REFERENCES project_groups(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deployments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        service VARCHAR(100) NOT NULL,
        script VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        logs TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create maintenance_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold')),
        assigned_to INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id) NOT NULL,
        scheduled_date TIMESTAMP,
        completed_date TIMESTAMP,
        estimated_duration INTEGER, -- in minutes
        actual_duration INTEGER, -- in minutes
        category VARCHAR(50),
        tags TEXT, -- comma-separated
        affected_systems TEXT, -- comma-separated
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create maintenance_status_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_status_history (
        id SERIAL PRIMARY KEY,
        maintenance_request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
        old_status VARCHAR(20),
        new_status VARCHAR(20) NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    // Create maintenance_work_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_work_logs (
        id SERIAL PRIMARY KEY,
        maintenance_request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        hours_worked DECIMAL(4,2),
        work_date DATE,
        logged_by INTEGER REFERENCES users(id),
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_projects_group_id ON projects(project_group_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
      CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
      CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);
      CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_by ON maintenance_requests(created_by);
      CREATE INDEX IF NOT EXISTS idx_maintenance_status_history_request_id ON maintenance_status_history(maintenance_request_id);
      CREATE INDEX IF NOT EXISTS idx_maintenance_work_logs_request_id ON maintenance_work_logs(maintenance_request_id);
    `);

    logger.info("Database migrations completed successfully", {
      adminId: req.user.id,
    });

    res.json({
      message: "Database migrations completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database migration error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to run database migrations",
      details: error.message,
    });
  }
};

// Check migration status
const checkMigrationStatus = async (req, res) => {
  try {
    const tables = [
      "users",
      "project_groups",
      "projects",
      "deployments",
      "maintenance_requests",
      "maintenance_status_history",
      "maintenance_work_logs",
    ];

    const tableStatus = {};

    for (const table of tables) {
      try {
        const result = await pool.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `,
          [table]
        );

        tableStatus[table] = {
          exists: result.rows[0].exists,
          status: result.rows[0].exists ? "created" : "missing",
        };

        if (result.rows[0].exists) {
          // Get row count
          const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${table}`
          );
          tableStatus[table].rowCount = parseInt(countResult.rows[0].count);
        }
      } catch (error) {
        tableStatus[table] = {
          exists: false,
          status: "error",
          error: error.message,
        };
      }
    }

    const allTablesExist = Object.values(tableStatus).every(
      (status) => status.exists
    );

    res.json({
      migrationStatus: allTablesExist ? "completed" : "incomplete",
      tables: tableStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Check migration status error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check migration status",
    });
  }
};

// Reset database (admin only - dangerous operation)
const resetDatabase = async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== "RESET_DATABASE") {
      return res.status(400).json({
        error: "Validation Error",
        message:
          "Please confirm database reset by sending 'RESET_DATABASE' in the confirm field",
      });
    }

    logger.info("Starting database reset", { adminId: req.user.id });

    // Drop tables in reverse order to handle foreign key constraints
    const dropQueries = [
      "DROP TABLE IF EXISTS maintenance_work_logs CASCADE",
      "DROP TABLE IF EXISTS maintenance_status_history CASCADE",
      "DROP TABLE IF EXISTS maintenance_requests CASCADE",
      "DROP TABLE IF EXISTS deployments CASCADE",
      "DROP TABLE IF EXISTS projects CASCADE",
      "DROP TABLE IF EXISTS project_groups CASCADE",
      "DROP TABLE IF EXISTS users CASCADE",
    ];

    for (const query of dropQueries) {
      await pool.query(query);
    }

    logger.info("Database reset completed", { adminId: req.user.id });

    res.json({
      message:
        "Database reset completed successfully. All tables have been dropped.",
      warning:
        "You will need to run migrations again to recreate the database structure.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database reset error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to reset database",
      details: error.message,
    });
  }
};

// Seed database with initial data
const seedDatabase = async (req, res) => {
  try {
    logger.info("Starting database seeding", { adminId: req.user.id });

    // Check if admin user already exists
    const adminCheck = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminCheck.rows.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        message:
          "Database already contains admin users. Seeding skipped to prevent duplicates.",
      });
    }

    // Create default admin user (password: admin123)
    const bcrypt = require("bcrypt");
    const adminPassword = await bcrypt.hash("admin123", 10);

    await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
       VALUES ('admin', 'admin@techops.com', $1, 'System', 'Administrator', 'admin', true)`,
      [adminPassword]
    );

    // Create sample project groups
    const projectGroups = [
      {
        name: "Web Applications",
        description: "Frontend and backend web applications",
      },
      {
        name: "Infrastructure",
        description: "Server and infrastructure projects",
      },
      { name: "Mobile Apps", description: "Mobile application projects" },
    ];

    for (const group of projectGroups) {
      await pool.query(
        "INSERT INTO project_groups (name, description) VALUES ($1, $2)",
        [group.name, group.description]
      );
    }

    // Create sample projects
    const webGroupResult = await pool.query(
      "SELECT id FROM project_groups WHERE name = 'Web Applications'"
    );
    const webGroupId = webGroupResult.rows[0].id;

    const projects = [
      {
        name: "TechOps Dashboard",
        description: "Main dashboard application",
        groupId: webGroupId,
      },
      {
        name: "API Gateway",
        description: "Central API gateway service",
        groupId: webGroupId,
      },
    ];

    for (const project of projects) {
      await pool.query(
        "INSERT INTO projects (name, description, project_group_id) VALUES ($1, $2, $3)",
        [project.name, project.description, project.groupId]
      );
    }

    logger.info("Database seeding completed successfully", {
      adminId: req.user.id,
    });

    res.json({
      message: "Database seeded successfully",
      data: {
        adminUser: {
          username: "admin",
          email: "admin@techops.com",
          password: "admin123",
          note: "Please change the default password after first login",
        },
        projectGroups: projectGroups.length,
        projects: projects.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database seeding error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to seed database",
      details: error.message,
    });
  }
};

// Reset all auto-increment sequences to start from 1
const resetSequences = async (req, res) => {
  try {
    logger.info("Starting sequence reset", { adminId: req.user.id });

    // Get all sequences in the database
    const sequenceQuery = `
      SELECT schemaname, sequencename
      FROM pg_sequences
      WHERE schemaname = 'public'
    `;

    const sequences = await pool.query(sequenceQuery);

    if (sequences.rows.length === 0) {
      return res.status(200).json({
        message: "No sequences found to reset",
        timestamp: new Date().toISOString(),
      });
    }

    // Reset each sequence to start from 1
    const resetPromises = sequences.rows.map(async (seq) => {
      const resetQuery = `ALTER SEQUENCE ${seq.schemaname}.${seq.sequencename} RESTART WITH 1`;
      await pool.query(resetQuery);
      logger.info(`Reset sequence: ${seq.sequencename}`);
      return seq.sequencename;
    });

    const resetSequenceNames = await Promise.all(resetPromises);

    logger.info("All sequences reset successfully", {
      adminId: req.user.id,
      sequences: resetSequenceNames,
    });

    res.json({
      message: "All sequences reset successfully",
      resetSequences: resetSequenceNames,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Reset sequences error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to reset sequences",
      details: error.message,
    });
  }
};

// Clear all data from tables (but keep structure)
const clearAllData = async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== "CLEAR_ALL_DATA") {
      return res.status(400).json({
        error: "Validation Error",
        message:
          "Please confirm data clearing by sending 'CLEAR_ALL_DATA' in the confirm field",
      });
    }

    logger.info("Starting data clearing", { adminId: req.user.id });

    // Clear tables in order to handle foreign key constraints
    const clearQueries = [
      "DELETE FROM maintenance_work_logs",
      "DELETE FROM maintenance_status_history",
      "DELETE FROM maintenance_requests",
      "DELETE FROM deployments",
      "DELETE FROM projects",
      "DELETE FROM project_groups",
      "DELETE FROM users",
    ];

    for (const query of clearQueries) {
      await pool.query(query);
    }

    // Reset all sequences to start from 1
    const sequenceQuery = `
      SELECT schemaname, sequencename
      FROM pg_sequences
      WHERE schemaname = 'public'
    `;

    const sequences = await pool.query(sequenceQuery);

    for (const seq of sequences.rows) {
      const resetQuery = `ALTER SEQUENCE ${seq.schemaname}.${seq.sequencename} RESTART WITH 1`;
      await pool.query(resetQuery);
    }

    logger.info("All data cleared and sequences reset", {
      adminId: req.user.id,
    });

    res.json({
      message: "All data cleared and sequences reset successfully",
      clearedTables: clearQueries.length,
      resetSequences: sequences.rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Clear all data error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to clear data",
      details: error.message,
    });
  }
};

// Add engineer assignment column to projects table
const addProjectEngineerAssignment = async (req, res) => {
  try {
    logger.info("Adding engineer assignment column to projects table", {
      adminId: req.user.id,
    });

    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = 'assigned_engineer_id'
    `);

    if (checkColumn.rows.length > 0) {
      return res.status(200).json({
        message: "Engineer assignment column already exists",
        timestamp: new Date().toISOString(),
      });
    }

    // Add the column
    await pool.query(`
      ALTER TABLE projects
      ADD COLUMN assigned_engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);

    // Add index
    await pool.query(`
      CREATE INDEX idx_projects_assigned_engineer_id ON projects(assigned_engineer_id)
    `);

    // Add comment
    await pool.query(`
      COMMENT ON COLUMN projects.assigned_engineer_id IS 'ID of the engineer assigned to this project'
    `);

    logger.info("Engineer assignment column added successfully", {
      adminId: req.user.id,
    });

    res.json({
      message: "Engineer assignment column added successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Add engineer assignment column error", error, {
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to add engineer assignment column",
      details: error.message,
    });
  }
};

// Reset sequences for empty tables only
const resetSequencesForEmptyTables = async (req, res) => {
  try {
    logger.info("Starting sequence reset for empty tables", { adminId: req.user.id });

    const resetSequences = await resetAllSequencesForEmptyTables();

    if (resetSequences.length === 0) {
      return res.status(200).json({
        message: "No sequences needed to be reset (no empty tables found)",
        resetSequences: [],
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("Sequences reset for empty tables", {
      adminId: req.user.id,
      sequences: resetSequences,
    });

    res.json({
      message: `Successfully reset ${resetSequences.length} sequence(s) for empty tables`,
      resetSequences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Reset sequences for empty tables error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to reset sequences for empty tables",
      details: error.message,
    });
  }
};

// Get sequence status for monitoring
const getSequenceInfo = async (req, res) => {
  try {
    const sequences = await getSequenceStatus();
    
    res.json({
      message: "Sequence information retrieved successfully",
      sequences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Get sequence info error", error, { adminId: req.user?.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get sequence information",
      details: error.message,
    });
  }
};

module.exports = {
  runMigrations,
  checkMigrationStatus,
  resetDatabase,
  seedDatabase,
  resetSequences,
  clearAllData,
  addProjectEngineerAssignment,
  resetSequencesForEmptyTables,
  getSequenceInfo,
};
