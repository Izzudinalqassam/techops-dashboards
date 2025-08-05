// Export all services
export { apiService } from './apiService';
export { projectService } from './projectService';
export { deploymentService } from './deploymentService';
export { projectGroupService } from './projectGroupService';
export { authService } from './authService';

// Export service classes for testing
export { ProjectService } from './projectService';
export { DeploymentService } from './deploymentService';
export { ProjectGroupService } from './projectGroupService';
export { AuthService } from './authService';

// Re-export API configuration and errors
export { API_CONFIG, API_ENDPOINTS, ApiError } from '../config/api';

// Re-export types for convenience
export type { RegisterCredentials, RegistrationResponse } from '../types';
