const pool = require("../config/database");
const { logger } = require("../utils/logger");
const { mapDeploymentToFrontend } = require("../utils/userMapper");

// Create new deployment
const createDeployment = async (req, res) => {
  try {
    const {
      projectId,
      name,
      status,
      engineerId,
      description,
      scripts,
      services,
      deployedAt,
    } = req.body;

    // Insert the deployment
    const insertResult = await pool.query(
      `INSERT INTO deployments (
        project_id, deployment_name, status, deployed_by,
        notes, services, deployed_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id`,
      [
        projectId,
        name,
        status,
        engineerId,
        description,
        services,
        deployedAt
          ? new Date(deployedAt).toISOString()
          : new Date().toISOString(),
      ]
    );

    const deploymentId = insertResult.rows[0].id;

    // Insert scripts if provided
    if (scripts && Array.isArray(scripts) && scripts.length > 0) {
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        if (script.title || script.content) {
          await pool.query(
            `INSERT INTO deployment_scripts (deployment_id, title, content, execution_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [deploymentId, script.title || '', script.content || '', i + 1]
          );
        }
      }
    }

    // Fetch the complete deployment data with engineer and project information
    const result = await pool.query(
      `SELECT d.*, p.name as project_name, pg.name as project_group_name,
              u.id as engineer_id, u.first_name as engineer_first_name,
              u.last_name as engineer_last_name, u.email as engineer_email,
              CONCAT(u.first_name, ' ', u.last_name) as engineer_name
       FROM deployments d
       LEFT JOIN projects p ON d.project_id = p.id
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       LEFT JOIN users u ON d.deployed_by = u.id
       WHERE d.id = $1`,
      [deploymentId]
    );

    const mappedDeployment = mapDeploymentToFrontend(result.rows[0]);

    logger.info("Deployment created", {
      deploymentId,
      projectId: projectId,
    });
    res.status(201).json(mappedDeployment);
  } catch (error) {
    logger.error("Create deployment error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create deployment",
    });
  }
};

// Get all deployments
const getDeployments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, p.name as project_name, pg.name as project_group_name,
              u.id as engineer_id, u.first_name as engineer_first_name,
              u.last_name as engineer_last_name, u.email as engineer_email,
              CONCAT(u.first_name, ' ', u.last_name) as engineer_name
       FROM deployments d
       LEFT JOIN projects p ON d.project_id = p.id
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       LEFT JOIN users u ON d.deployed_by = u.id
       ORDER BY d.deployed_at DESC`
    );

    const mappedDeployments = result.rows.map(mapDeploymentToFrontend);
    res.json(mappedDeployments);
  } catch (error) {
    logger.error("Get deployments error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch deployments",
    });
  }
};

// Get specific deployment
const getDeploymentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch deployment details
    const deploymentResult = await pool.query(
      `SELECT d.*, p.name as project_name, pg.name as project_group_name,
              u.id as engineer_id, u.first_name as engineer_first_name,
              u.last_name as engineer_last_name, u.email as engineer_email,
              CONCAT(u.first_name, ' ', u.last_name) as engineer_name
       FROM deployments d
       LEFT JOIN projects p ON d.project_id = p.id
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       LEFT JOIN users u ON d.deployed_by = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (deploymentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Deployment not found",
      });
    }

    // Fetch associated scripts
    const scriptsResult = await pool.query(
      "SELECT id, title, content FROM deployment_scripts WHERE deployment_id = $1 ORDER BY execution_order",
      [id]
    );

    const mappedDeployment = mapDeploymentToFrontend(deploymentResult.rows[0]);
    
    // Attach scripts to the deployment object
    mappedDeployment.scripts = scriptsResult.rows;

    logger.info("Deployment fetched", { deploymentId: id });
    res.json(mappedDeployment);
  } catch (error) {
    logger.error("Get deployment by ID error", error, {
      deploymentId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch deployment",
    });
  }
};

// Update deployment
const updateDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId, name, status, engineerId, description, scripts, services } = req.body;

    // Update deployment basic information
    const result = await pool.query(
      `UPDATE deployments 
       SET project_id = $1, deployment_name = $2, status = $3, 
           deployed_by = $4, notes = $5, services = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [projectId, name, status, engineerId, description, services, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Deployment not found",
      });
    }

    // Update scripts if provided
    if (scripts && Array.isArray(scripts)) {
      // Delete existing scripts
      await pool.query(
        "DELETE FROM deployment_scripts WHERE deployment_id = $1",
        [id]
      );

      // Insert new scripts
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        if (script.title || script.content) {
          await pool.query(
            `INSERT INTO deployment_scripts (deployment_id, title, content, execution_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [id, script.title || '', script.content || '', i + 1]
          );
        }
      }
    }

    // Fetch updated deployment with scripts
    const updatedDeployment = await pool.query(
      `SELECT d.*, p.name as project_name, pg.name as project_group_name,
              u.id as engineer_id, u.first_name as engineer_first_name,
              u.last_name as engineer_last_name, u.email as engineer_email,
              CONCAT(u.first_name, ' ', u.last_name) as engineer_name
       FROM deployments d
       LEFT JOIN projects p ON d.project_id = p.id
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       LEFT JOIN users u ON d.deployed_by = u.id
       WHERE d.id = $1`,
      [id]
    );

    // Fetch associated scripts
    const scriptsResult = await pool.query(
      "SELECT id, title, content FROM deployment_scripts WHERE deployment_id = $1 ORDER BY execution_order",
      [id]
    );

    const mappedDeployment = mapDeploymentToFrontend(updatedDeployment.rows[0]);
    mappedDeployment.scripts = scriptsResult.rows;

    logger.info("Deployment updated", { deploymentId: id });
    res.json(mappedDeployment);
  } catch (error) {
    logger.error("Update deployment error", error, {
      deploymentId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update deployment",
    });
  }
};

// Delete deployment
const deleteDeployment = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the deployment directly (no deployment_services table in current schema)
    const result = await pool.query(
      "DELETE FROM deployments WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Deployment not found",
      });
    }

    logger.info("Deployment deleted", { deploymentId: id });
    res.status(204).send(); // Use 204 No Content for successful deletion
  } catch (error) {
    logger.error("Delete deployment error", error, {
      deploymentId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete deployment",
    });
  }
};

// Get services (from deployments.services field)
const getServices = async (req, res) => {
  try {
    // Get distinct services from the services text field in deployments table
    const result = await pool.query(`
      SELECT DISTINCT TRIM(unnest(string_to_array(services, ','))) as service_name
      FROM deployments
      WHERE services IS NOT NULL AND services != ''
      ORDER BY service_name
    `);
    res.json(result.rows.map((row) => row.service_name).filter((name) => name));
  } catch (error) {
    logger.error("Get services error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch services",
    });
  }
};

// Get deployment services (from deployments table)
const getDeploymentServices = async (req, res) => {
  try {
    // Return deployments with their services parsed from the services field
    const result = await pool.query(`
      SELECT
        d.id as deployment_id,
        d.name as deployment_name,
        d.services,
        d.status,
        d.deployed_at,
        p.name as project_name
      FROM deployments d
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.services IS NOT NULL AND d.services != ''
      ORDER BY d.id
    `);
    res.json(result.rows);
  } catch (error) {
    logger.error("Get deployment services error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch deployment services",
    });
  }
};

// Get scripts
const getScripts = async (req, res) => {
  try {
    const { deploymentId } = req.query;
    
    if (deploymentId) {
      // Get scripts for a specific deployment
      const result = await pool.query(
        "SELECT id, title, content, execution_order FROM deployment_scripts WHERE deployment_id = $1 ORDER BY execution_order",
        [deploymentId]
      );
      res.json(result.rows);
    } else {
      // Get all distinct script titles (if deployment_scripts table exists)
      try {
        const result = await pool.query(
          "SELECT DISTINCT title FROM deployment_scripts ORDER BY title"
        );
        res.json(result.rows.map((row) => row.title));
      } catch (dbError) {
        // If deployment_scripts table doesn't exist, return empty array
        logger.warn("deployment_scripts table not found, returning empty array");
        res.json([]);
      }
    }
  } catch (error) {
    logger.error("Get scripts error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch scripts",
    });
  }
};

module.exports = {
  createDeployment,
  getDeployments,
  getDeploymentById,
  updateDeployment,
  deleteDeployment,
  getServices,
  getDeploymentServices,
  getScripts,
};
