import { useAuth } from '../contexts/AuthContext';
import { 
  Permission, 
  hasPermission, 
  canDelete, 
  canCreate, 
  canUpdate, 
  canRead,
  isAdmin,
  isManagerOrHigher,
  isGuest,
  getRoleLevel,
  hasHigherRole
} from '../utils/permissions';
import { UserRole } from '../types';

interface UsePermissionsReturn {
  // Current user role
  userRole: UserRole | null;
  
  // Permission checkers
  hasPermission: (permission: Permission) => boolean;
  canDelete: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
  canCreate: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
  canUpdate: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
  canRead: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
  
  // Role checkers
  isAdmin: boolean;
  isManagerOrHigher: boolean;
  isGuest: boolean;
  
  // Role comparison
  getRoleLevel: () => number;
  hasHigherRole: (compareRole: UserRole) => boolean;
  
  // Convenience methods for common UI patterns
  canDeleteProjects: boolean;
  canDeleteProjectGroups: boolean;
  canDeleteDeployments: boolean;
  canManageUsers: boolean;
  canViewAdminPanel: boolean;
  
  // UI helpers
  shouldShowDeleteButton: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
  shouldShowCreateButton: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
  shouldShowEditButton: (resourceType: 'project' | 'project_group' | 'deployment') => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { state } = useAuth();
  const userRole = state.user?.role || null;

  // Permission checkers
  const checkPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const checkCanDelete = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    if (!userRole) return false;
    return canDelete(userRole, resourceType);
  };

  const checkCanCreate = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    if (!userRole) return false;
    return canCreate(userRole, resourceType);
  };

  const checkCanUpdate = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    if (!userRole) return false;
    return canUpdate(userRole, resourceType);
  };

  const checkCanRead = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    if (!userRole) return false;
    return canRead(userRole, resourceType);
  };

  // Role checkers
  const userIsAdmin = userRole ? isAdmin(userRole) : false;
  const userIsManagerOrHigher = userRole ? isManagerOrHigher(userRole) : false;
  const userIsGuest = userRole ? isGuest(userRole) : false;

  // Role comparison
  const getUserRoleLevel = (): number => {
    if (!userRole) return 0;
    return getRoleLevel(userRole);
  };

  const userHasHigherRole = (compareRole: UserRole): boolean => {
    if (!userRole) return false;
    return hasHigherRole(userRole, compareRole);
  };

  // Convenience methods for common UI patterns
  const canDeleteProjects = checkCanDelete('project');
  const canDeleteProjectGroups = checkCanDelete('project_group');
  const canDeleteDeployments = checkCanDelete('deployment');
  const canManageUsers = checkPermission('manage_users');
  const canViewAdminPanel = checkPermission('view_admin_panel');

  // UI helpers
  const shouldShowDeleteButton = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    return checkCanDelete(resourceType);
  };

  const shouldShowCreateButton = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    return checkCanCreate(resourceType);
  };

  const shouldShowEditButton = (resourceType: 'project' | 'project_group' | 'deployment'): boolean => {
    return checkCanUpdate(resourceType);
  };

  return {
    // Current user role
    userRole,
    
    // Permission checkers
    hasPermission: checkPermission,
    canDelete: checkCanDelete,
    canCreate: checkCanCreate,
    canUpdate: checkCanUpdate,
    canRead: checkCanRead,
    
    // Role checkers
    isAdmin: userIsAdmin,
    isManagerOrHigher: userIsManagerOrHigher,
    isGuest: userIsGuest,
    
    // Role comparison
    getRoleLevel: getUserRoleLevel,
    hasHigherRole: userHasHigherRole,
    
    // Convenience methods
    canDeleteProjects,
    canDeleteProjectGroups,
    canDeleteDeployments,
    canManageUsers,
    canViewAdminPanel,
    
    // UI helpers
    shouldShowDeleteButton,
    shouldShowCreateButton,
    shouldShowEditButton,
  };
};
