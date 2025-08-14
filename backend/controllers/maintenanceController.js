const pool = require("../config/database");
const { mapMaintenanceRequestToFrontend } = require("../utils/userMapper");
const { logger } = require("../utils/logger");
const { resetSequenceIfTableEmpty } = require("../utils/sequenceUtils");

// Helper function to generate unique request number
const generateRequestNumber = async (clientName) => {
  try {
    // Generate client abbreviation from client name
    const clientAbbreviation = clientName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 3) // Limit to 3 characters
      .padEnd(3, "X"); // Pad with X if less than 3 characters

    // Get current date in YYYYMMDD format
    const currentDate = new Date();
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");

    // Find the next sequence number for today
    const sequenceQuery = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM LENGTH(request_number) - 2) AS INTEGER)), 0) + 1 as next_sequence
      FROM maintenance_requests
      WHERE request_number LIKE $1
    `;

    const pattern = `MR-${clientAbbreviation}-${dateString}-%`;
    const sequenceResult = await pool.query(sequenceQuery, [pattern]);
    const nextSequence = sequenceResult.rows[0].next_sequence;

    // Format sequence number with leading zeros (001, 002, etc.)
    const sequenceNumber = nextSequence.toString().padStart(3, "0");

    // Generate final request number
    const requestNumber = `MR-${clientAbbreviation}-${dateString}-${sequenceNumber}`;

    return requestNumber;
  } catch (error) {
    logger.error("Error generating request number", error);
    // Fallback to timestamp-based number if generation fails
    const timestamp = Date.now().toString().slice(-6);
    return `MR-GEN-${timestamp}`;
  }
};

// Get all maintenance requests
const getMaintenanceRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      createdBy,
      category,
      search,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (status && status !== "all") {
      whereConditions.push(`mr.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (priority && priority !== "all") {
      whereConditions.push(`mr.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }

    if (assignedTo && assignedTo !== "all") {
      whereConditions.push(`mr.assigned_engineer_id = $${paramIndex}`);
      queryParams.push(parseInt(assignedTo));
      paramIndex++;
    }

    if (createdBy && createdBy !== "all") {
      whereConditions.push(`mr.created_by_id = $${paramIndex}`);
      queryParams.push(parseInt(createdBy));
      paramIndex++;
    }

    if (category && category !== "all") {
      whereConditions.push(`mr.category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        mr.title ILIKE $${paramIndex} OR 
        mr.description ILIKE $${paramIndex} OR 
        mr.notes ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Validate sort parameters
    const validSortColumns = [
      "created_at",
      "updated_at",
      "scheduled_date",
      "priority",
      "status",
      "title",
    ];
    const validSortOrders = ["asc", "desc"];
    const finalSortBy = validSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    const query = `
      SELECT 
        mr.*,
        u1.first_name as assigned_to_first_name,
        u1.last_name as assigned_to_last_name,
        u1.email as assigned_to_email,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        u2.first_name as created_by_first_name,
        u2.last_name as created_by_last_name,
        u2.email as created_by_email,
        CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN users u1 ON mr.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON mr.created_by_id = u2.id
      ${whereClause}
      ORDER BY mr.${finalSortBy} ${finalSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM maintenance_requests mr
      LEFT JOIN users u1 ON mr.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON mr.created_by_id = u2.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    const maintenanceRequests = result.rows.map(
      mapMaintenanceRequestToFrontend
    );

    res.json({
      maintenanceRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        status,
        priority,
        assignedTo,
        createdBy,
        category,
        search,
      },
      sorting: {
        sortBy: finalSortBy,
        sortOrder: finalSortOrder.toLowerCase(),
      },
    });
  } catch (error) {
    logger.error("Get maintenance requests error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch maintenance requests",
    });
  }
};

// Get maintenance statistics
const getMaintenanceStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'On Hold' THEN 1 END) as on_hold_count,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_count,
        COUNT(CASE WHEN scheduled_date < NOW() AND status != 'Completed' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
      FROM maintenance_requests
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      totalRequests: parseInt(stats.total_requests),
      statusCounts: {
        pending: parseInt(stats.pending_count),
        inProgress: parseInt(stats.in_progress_count),
        completed: parseInt(stats.completed_count),
        cancelled: parseInt(stats.cancelled_count),
        onHold: parseInt(stats.on_hold_count),
      },
      priorityCounts: {
        critical: parseInt(stats.critical_count),
        high: parseInt(stats.high_count),
      },
      overdueCount: parseInt(stats.overdue_count),
      recentCount: parseInt(stats.recent_count),
    });
  } catch (error) {
    logger.error("Get maintenance stats error", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch maintenance statistics",
    });
  }
};

// Get specific maintenance request
const getMaintenanceRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        mr.*,
        u1.first_name as assigned_to_first_name,
        u1.last_name as assigned_to_last_name,
        u1.email as assigned_to_email,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        u2.first_name as created_by_first_name,
        u2.last_name as created_by_last_name,
        u2.email as created_by_email,
        CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN users u1 ON mr.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON mr.created_by_id = u2.id
      WHERE mr.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Maintenance request not found",
      });
    }

    const maintenanceRequest = mapMaintenanceRequestToFrontend(result.rows[0]);

    res.json({ maintenanceRequest });
  } catch (error) {
    logger.error("Get maintenance request by ID error", error, {
      maintenanceId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch maintenance request",
    });
  }
};

// Create maintenance request
const createMaintenanceRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      client_name,
      client_email,
      client_phone,
      client_company,
      assigned_engineer_id,
      scheduled_date,
      // Legacy fields for backward compatibility
      assignedTo,
      scheduledDate,
    } = req.body;

    const createdBy = req.user.id;

    // Use client data from request or fallback to defaults for internal requests
    const clientName = client_name || "Internal Request";
    const clientEmail = client_email || "internal@company.com";
    const clientPhone = client_phone || "N/A";
    const clientCompany = client_company || "Internal";
    const assignedEngineerId = assigned_engineer_id || assignedTo || null;
    const scheduledDateValue = scheduled_date || scheduledDate || null;

    // Generate unique request number
    const requestNumber = await generateRequestNumber(clientName);

    const result = await pool.query(
      `INSERT INTO maintenance_requests (
        request_number, title, description, priority, status, assigned_engineer_id, created_by_id,
        scheduled_date, category, client_name, client_email, client_phone, client_company,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'Pending', $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        requestNumber,
        title,
        description,
        priority,
        assignedEngineerId,
        createdBy,
        scheduledDateValue,
        category || null,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
      ]
    );

    // Log status change (using correct column names)
    await pool.query(
      `INSERT INTO maintenance_status_history (request_id, old_status, new_status, changed_by_id, change_reason)
       VALUES ($1, NULL, 'Pending', $2, 'Initial creation')`,
      [result.rows[0].id, createdBy]
    );

    logger.info("Maintenance request created", {
      maintenanceId: result.rows[0].id,
      createdBy,
    });

    // Fetch the complete record with user details
    const completeResult = await pool.query(
      `SELECT 
        mr.*,
        u1.first_name as assigned_to_first_name,
        u1.last_name as assigned_to_last_name,
        u1.email as assigned_to_email,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        u2.first_name as created_by_first_name,
        u2.last_name as created_by_last_name,
        u2.email as created_by_email,
        CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN users u1 ON mr.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON mr.created_by_id = u2.id
      WHERE mr.id = $1`,
      [result.rows[0].id]
    );

    const maintenanceRequest = mapMaintenanceRequestToFrontend(
      completeResult.rows[0]
    );

    res.status(201).json({
      message: "Maintenance request created successfully",
      maintenanceRequest,
    });
  } catch (error) {
    logger.error("Create maintenance request error", error, {
      userId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create maintenance request",
    });
  }
};

// Update maintenance request (admin only)
const updateMaintenanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      assignedTo,
      scheduledDate,
      estimatedDuration,
      category,
      tags,
      affectedSystems,
      notes,
    } = req.body;

    // Check if maintenance request exists
    const existingRequest = await pool.query(
      "SELECT * FROM maintenance_requests WHERE id = $1",
      [id]
    );

    if (existingRequest.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Maintenance request not found",
      });
    }

    const result = await pool.query(
      `UPDATE maintenance_requests
       SET title = $1, description = $2, priority = $3, assigned_engineer_id = $4,
           scheduled_date = $5, category = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        title,
        description,
        priority,
        assignedTo || null,
        scheduledDate || null,
        category || null,
        id,
      ]
    );

    logger.info("Maintenance request updated", {
      maintenanceId: id,
      adminId: req.user.id,
    });

    // Fetch the complete record with user details
    const completeResult = await pool.query(
      `SELECT 
        mr.*,
        u1.first_name as assigned_to_first_name,
        u1.last_name as assigned_to_last_name,
        u1.email as assigned_to_email,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        u2.first_name as created_by_first_name,
        u2.last_name as created_by_last_name,
        u2.email as created_by_email,
        CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN users u1 ON mr.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON mr.created_by_id = u2.id
      WHERE mr.id = $1`,
      [id]
    );

    const maintenanceRequest = mapMaintenanceRequestToFrontend(
      completeResult.rows[0]
    );

    res.json({
      message: "Maintenance request updated successfully",
      maintenanceRequest,
    });
  } catch (error) {
    logger.error("Update maintenance request error", error, {
      maintenanceId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update maintenance request",
    });
  }
};

// Delete maintenance request (admin only)
const deleteMaintenanceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related records first
    await pool.query(
      "DELETE FROM maintenance_work_logs WHERE request_id = $1",
      [id]
    );
    await pool.query(
      "DELETE FROM maintenance_status_history WHERE request_id = $1",
      [id]
    );

    // Delete the maintenance request
    const result = await pool.query(
      "DELETE FROM maintenance_requests WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Maintenance request not found",
      });
    }

    // Check if tables are empty and reset sequences if needed
    await resetSequenceIfTableEmpty("maintenance_work_logs");
    await resetSequenceIfTableEmpty("maintenance_status_history");
    await resetSequenceIfTableEmpty("maintenance_requests");

    logger.info("Maintenance request deleted", {
      maintenanceId: id,
      adminId: req.user.id,
    });

    res.json({
      message: "Maintenance request deleted successfully",
    });
  } catch (error) {
    logger.error("Delete maintenance request error", error, {
      maintenanceId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete maintenance request",
    });
  }
};

// Update maintenance status (admin only)
const updateMaintenanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, completedDate, actualDuration } = req.body;

    // Validate status
    const validStatuses = [
      "Pending",
      "In Progress",
      "Completed",
      "Cancelled",
      "On Hold",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Invalid status value",
      });
    }

    // Get current status
    const currentResult = await pool.query(
      "SELECT status FROM maintenance_requests WHERE id = $1",
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Maintenance request not found",
      });
    }

    const oldStatus = currentResult.rows[0].status;

    // Update the maintenance request
    let updateQuery = `
      UPDATE maintenance_requests 
      SET status = $1, updated_at = NOW()
    `;
    let queryParams = [status];
    let paramIndex = 2;

    if (status === "Completed" && completedDate) {
      updateQuery += `, completed_date = $${paramIndex}`;
      queryParams.push(completedDate);
      paramIndex++;
    }

    // Note: actual_duration column doesn't exist in current schema
    // if (status === "Completed" && actualDuration) {
    //   updateQuery += `, actual_duration = $${paramIndex}`;
    //   queryParams.push(actualDuration);
    //   paramIndex++;
    // }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    queryParams.push(id);

    const result = await pool.query(updateQuery, queryParams);

    // Log status change (using correct column names)
    await pool.query(
      `INSERT INTO maintenance_status_history (request_id, old_status, new_status, changed_by_id, change_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, oldStatus, status, req.user.id, notes || "Status updated"]
    );

    logger.info("Maintenance status updated", {
      maintenanceId: id,
      oldStatus,
      newStatus: status,
      adminId: req.user.id,
    });

    // Fetch the complete record with user details
    const completeResult = await pool.query(
      `SELECT 
        mr.*,
        u1.first_name as assigned_to_first_name,
        u1.last_name as assigned_to_last_name,
        u1.email as assigned_to_email,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        u2.first_name as created_by_first_name,
        u2.last_name as created_by_last_name,
        u2.email as created_by_email,
        CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN users u1 ON mr.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON mr.created_by_id = u2.id
      WHERE mr.id = $1`,
      [id]
    );

    const maintenanceRequest = mapMaintenanceRequestToFrontend(
      completeResult.rows[0]
    );

    res.json({
      message: "Maintenance status updated successfully",
      maintenanceRequest,
    });
  } catch (error) {
    logger.error("Update maintenance status error", error, {
      maintenanceId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update maintenance status",
    });
  }
};

// Get work logs for maintenance request
const getWorkLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT wl.*, u.first_name, u.last_name, u.email,
              CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM maintenance_work_logs wl
       LEFT JOIN users u ON wl.engineer_id = u.id
       WHERE wl.request_id = $1
       ORDER BY wl.created_at DESC`,
      [id]
    );

    res.json({ workLogs: result.rows });
  } catch (error) {
    logger.error("Get work logs error", error, {
      maintenanceId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch work logs",
    });
  }
};

// Add work log (admin only)
const addWorkLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, hoursWorked, workDate } = req.body;

    // Check if maintenance request exists
    const requestCheck = await pool.query(
      "SELECT id FROM maintenance_requests WHERE id = $1",
      [id]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Maintenance request not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_work_logs (request_id, work_description, hours_spent, engineer_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, description, hoursWorked || null, req.user.id]
    );

    logger.info("Work log added", {
      maintenanceId: id,
      workLogId: result.rows[0].id,
      adminId: req.user.id,
    });

    // Fetch the complete work log with user details
    const completeResult = await pool.query(
      `SELECT wl.*, u.first_name, u.last_name, u.email,
              CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM maintenance_work_logs wl
       LEFT JOIN users u ON wl.author_id = u.id
       WHERE wl.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      message: "Work log added successfully",
      workLog: completeResult.rows[0],
    });
  } catch (error) {
    logger.error("Add work log error", error, {
      maintenanceId: req.params.id,
      adminId: req.user?.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to add work log",
    });
  }
};

// Get status history for maintenance request
const getStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT sh.*, u.first_name, u.last_name, u.email,
              CONCAT(u.first_name, ' ', u.last_name) as changed_by_name
       FROM maintenance_status_history sh
       LEFT JOIN users u ON sh.changed_by_id = u.id
       WHERE sh.request_id = $1
       ORDER BY sh.changed_at DESC`,
      [id]
    );

    res.json({ statusHistory: result.rows });
  } catch (error) {
    logger.error("Get status history error", error, {
      maintenanceId: req.params.id,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch status history",
    });
  }
};

module.exports = {
  getMaintenanceRequests,
  getMaintenanceStats,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  updateMaintenanceStatus,
  getWorkLogs,
  addWorkLog,
  getStatusHistory,
};
