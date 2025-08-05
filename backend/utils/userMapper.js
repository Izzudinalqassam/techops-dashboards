// Helper function to normalize role from database to frontend format
const normalizeRole = (role) => {
  if (!role) return "User";

  // Convert database role (lowercase) to frontend format (title case)
  switch (role.toLowerCase()) {
    case "admin":
      return "Admin";
    case "user":
      return "User";
    case "engineer":
      return "Engineer";
    default:
      return "User";
  }
};

// Sanitize user data by removing sensitive information
const sanitizeUser = (user) => {
  const { password_hash, ...sanitized } = user;
  return {
    ...sanitized,
    firstName: user.first_name,
    lastName: user.last_name,
    lastLogin: user.last_login,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    role: normalizeRole(user.role), // Normalize role to frontend format
  };
};

// Map user data for frontend consumption
const mapUserToFrontend = (user) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: normalizeRole(user.role), // Normalize role to frontend format
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLogin: user.last_login,
    fullName: `${user.first_name} ${user.last_name}`,
    initials: `${user.first_name?.charAt(0) || ""}${
      user.last_name?.charAt(0) || ""
    }`.toUpperCase(),
  };
};

// Map maintenance request data for frontend
const mapMaintenanceRequestToFrontend = (row) => {
  return {
    id: row.id,
    requestNumber: row.request_number,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientCompany: row.client_company,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    requestedDate: row.requested_date,
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    assignedEngineerId: row.assigned_engineer_id,
    assignedEngineer: row.assigned_engineer_id
      ? {
          id: row.assigned_engineer_id,
          firstName: row.assigned_to_first_name,
          lastName: row.assigned_to_last_name,
          email: row.assigned_to_email,
          fullName: row.assigned_to_name,
        }
      : null,
    createdById: row.created_by_id,
    createdBy: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: row.attachments || [],
    workLogs: row.work_logs || [],
    statusHistory: row.status_history || [],

    // Computed fields
    isOverdue:
      row.scheduled_date &&
      new Date(row.scheduled_date) < new Date() &&
      row.status !== "Completed",
    daysUntilScheduled: row.scheduled_date
      ? Math.ceil(
          (new Date(row.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
      : null,

    // Status styling
    statusColor:
      {
        Pending: "blue",
        "In Progress": "yellow",
        Completed: "green",
        Cancelled: "red",
        "On Hold": "gray",
      }[row.status] || "gray",

    // Priority styling
    priorityColor:
      {
        Low: "green",
        Medium: "yellow",
        High: "orange",
        Critical: "red",
      }[row.priority] || "gray",
  };
};

// Map project data from database to frontend format
const mapProjectToFrontend = (row) => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    groupId: row.group_id,
    repositoryUrl: row.repository_url,
    status: row.status,
    assignedEngineerId: row.assigned_engineer_id,
    assignedEngineer: row.assigned_engineer_id
      ? {
          id: row.engineer_id,
          firstName: row.engineer_first_name,
          lastName: row.engineer_last_name,
          email: row.engineer_email,
          fullName: row.engineer_name,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectGroupName: row.project_group_name,
  };
};

// Map deployment data from database to frontend format
const mapDeploymentToFrontend = (row) => {
  return {
    id: row.id,
    name: row.deployment_name,
    projectId: row.project_id,
    status: row.status,
    deployedAt: row.deployed_at,
    engineerId: row.deployed_by,
    engineer: row.deployed_by
      ? {
          id: row.engineer_id,
          firstName: row.engineer_first_name,
          lastName: row.engineer_last_name,
          email: row.engineer_email,
          fullName: row.engineer_name,
        }
      : null,
    description: row.notes,
    services: row.services,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectName: row.project_name,
    projectGroupName: row.project_group_name,
  };
};

module.exports = {
  normalizeRole,
  sanitizeUser,
  mapUserToFrontend,
  mapMaintenanceRequestToFrontend,
  mapProjectToFrontend,
  mapDeploymentToFrontend,
};
