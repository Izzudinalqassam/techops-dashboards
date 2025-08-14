const pool = require("../config/database");
const { logger } = require("../utils/logger");
const { mapProjectToFrontend } = require("../utils/userMapper");
const { resetSequenceIfTableEmpty } = require("../utils/sequenceUtils");

// Get all project groups
const getProjectGroups = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM project_groups ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Get project groups error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch project groups",
    });
  }
};

// Get specific project group
const getProjectGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM project_groups WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project group not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Get project group by ID error", error, {
      projectGroupId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch project group",
    });
  }
};

// Create new project group
const createProjectGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      "INSERT INTO project_groups (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );

    logger.info("Project group created", {
      projectGroupId: result.rows[0].id,
      name,
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error("Create project group error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create project group",
    });
  }
};

// Update project group
const updateProjectGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await pool.query(
      "UPDATE project_groups SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project group not found",
      });
    }

    logger.info("Project group updated", { projectGroupId: id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Update project group error", error, {
      projectGroupId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update project group",
    });
  }
};

// Delete project group
const deleteProjectGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are projects in this group
    const projectCheck = await pool.query(
      "SELECT COUNT(*) as count FROM projects WHERE group_id = $1",
      [id]
    );

    if (parseInt(projectCheck.rows[0].count) > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: "Cannot delete project group that contains projects",
      });
    }

    const result = await pool.query(
      "DELETE FROM project_groups WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project group not found",
      });
    }

    // Check if project_groups table is empty and reset sequence if needed
    await resetSequenceIfTableEmpty("project_groups");

    logger.info("Project group deleted", { projectGroupId: id });
    res.json({ message: "Project group deleted successfully" });
  } catch (error) {
    logger.error("Delete project group error", error, {
      projectGroupId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete project group",
    });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      group_id,
      repository_url,
      status,
      assigned_engineer_id,
    } = req.body;

    // Insert the project
    const insertResult = await pool.query(
      `INSERT INTO projects (name, description, group_id, repository_url, status, assigned_engineer_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [
        name,
        description,
        group_id,
        repository_url,
        status,
        assigned_engineer_id,
      ]
    );

    const projectId = insertResult.rows[0].id;

    // Fetch the complete project data with engineer information
    const result = await pool.query(
      `SELECT p.*, pg.name as project_group_name,
              u.id as engineer_id, u.first_name as engineer_first_name,
              u.last_name as engineer_last_name, u.email as engineer_email,
              CONCAT(u.first_name, ' ', u.last_name) as engineer_name
       FROM projects p
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       LEFT JOIN users u ON p.assigned_engineer_id = u.id
       WHERE p.id = $1`,
      [projectId]
    );

    const mappedProject = mapProjectToFrontend(result.rows[0]);

    logger.info("Project created", { projectId, name });
    res.status(201).json(mappedProject);
  } catch (error) {
    logger.error("Create project error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create project",
    });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pg.name as project_group_name,
              u.id as engineer_id, u.first_name as engineer_first_name,
              u.last_name as engineer_last_name, u.email as engineer_email,
              CONCAT(u.first_name, ' ', u.last_name) as engineer_name
       FROM projects p
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       LEFT JOIN users u ON p.assigned_engineer_id = u.id
       ORDER BY p.name`
    );

    const mappedProjects = result.rows.map(mapProjectToFrontend);
    res.json(mappedProjects);
  } catch (error) {
    logger.error("Get projects error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch projects",
    });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, pg.name as project_group_name 
       FROM projects p 
       LEFT JOIN project_groups pg ON p.group_id = pg.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Get project by ID error", error, {
      projectId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch project",
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, group_id, repository_url, status } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, group_id = $3, repository_url = $4, status = $5, updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [name, description, group_id, repository_url, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project not found",
      });
    }

    logger.info("Project updated", { projectId: id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Update project error", error, { projectId: req.params.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update project",
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are deployments for this project
    const deploymentCheck = await pool.query(
      "SELECT COUNT(*) as count FROM deployments WHERE project_id = $1",
      [id]
    );

    if (parseInt(deploymentCheck.rows[0].count) > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: "Cannot delete project that has deployments",
      });
    }

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project not found",
      });
    }

    // Check if projects table is empty and reset sequence if needed
    await resetSequenceIfTableEmpty("projects");

    logger.info("Project deleted", { projectId: id });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    logger.error("Delete project error", error, { projectId: req.params.id });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  getProjectGroups,
  getProjectGroupById,
  createProjectGroup,
  updateProjectGroup,
  deleteProjectGroup,
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
