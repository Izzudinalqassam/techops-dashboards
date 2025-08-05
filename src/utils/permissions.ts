import { UserRole } from '../types';

// Define permission types
export type Permission = 
  | 'create_project'
  | 'read_project'
  | 'update_project'
  | 'delete_project'
  | 'create_project_group'
  | 'read_project_group'
  | 'update_project_group'
  | 'delete_project_group'
  | 'create_deployment'
  | 'read_deployment'
  | 'update_deployment'
  | 'delete_deployment'
  | 'manage_users'
  | 'view_admin_panel';

// Role-based permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  Admin: [
    // Full access to everything
    'create_project',
    'read_project',
    'update_project',
    'delete_project',
    'create_project_group',
    'read_project_group',
    'update_project_group',
    'delete_project_group',
    'create_deployment',
    'read_deployment',
    'update_deployment',
    'delete_deployment',
    'manage_users',
    'view_admin_panel'
  ],
  User: [
    // Full access except user management
    'create_project',
    'read_project',
    'update_project',
    'delete_project',
    'create_project_group',
    'read_project_group',
    'update_project_group',
    'delete_project_group',
    'create_deployment',
    'read_deployment',
    'update_deployment',
    'delete_deployment'
  ]
};

/**
 * Check if a user role has a specific permission
 */
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Check if a user role can delete a specific resource type
 */
export const canDelete = (userRole: UserRole, resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
  switch (resourceType) {
    case 'project':
      return hasPermission(userRole, 'delete_project');
    case 'project_group':
      return hasPermission(userRole, 'delete_project_group');
    case 'deployment':
      return hasPermission(userRole, 'delete_deployment');
    default:
      return false;
  }
};

/**
 * Check if a user role can create a specific resource type
 */
export const canCreate = (userRole: UserRole, resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
  switch (resourceType) {
    case 'project':
      return hasPermission(userRole, 'create_project');
    case 'project_group':
      return hasPermission(userRole, 'create_project_group');
    case 'deployment':
      return hasPermission(userRole, 'create_deployment');
    default:
      return false;
  }
};

/**
 * Check if a user role can update a specific resource type
 */
export const canUpdate = (userRole: UserRole, resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
  switch (resourceType) {
    case 'project':
      return hasPermission(userRole, 'update_project');
    case 'project_group':
      return hasPermission(userRole, 'update_project_group');
    case 'deployment':
      return hasPermission(userRole, 'update_deployment');
    default:
      return false;
  }
};

/**
 * Check if a user role can read a specific resource type
 */
export const canRead = (userRole: UserRole, resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
  switch (resourceType) {
    case 'project':
      return hasPermission(userRole, 'read_project');
    case 'project_group':
      return hasPermission(userRole, 'read_project_group');
    case 'deployment':
      return hasPermission(userRole, 'read_deployment');
    default:
      return false;
  }
};

/**
 * Get all permissions for a user role
 */
export const getUserPermissions = (userRole: UserRole): Permission[] => {
  return rolePermissions[userRole] || [];
};

/**
 * Check if a user role has admin privileges
 */
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'Admin';
};

/**
 * Check if a user role has manager or higher privileges (now just Admin)
 */
export const isManagerOrHigher = (userRole: UserRole): boolean => {
  return userRole === 'Admin';
};

/**
 * Check if a user role is a guest (limited permissions) - deprecated, always returns false
 */
export const isGuest = (userRole: UserRole): boolean => {
  return false; // No guest role in simplified system
};

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export const getRoleLevel = (userRole: UserRole): number => {
  const roleLevels: Record<UserRole, number> = {
    User: 1,
    Admin: 2
  };
  return roleLevels[userRole] || 0;
};

/**
 * Check if one role has higher privileges than another
 */
export const hasHigherRole = (userRole: UserRole, compareRole: UserRole): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(compareRole);
};
