// Core data models
export interface Engineer {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  fullName: string;
  initials: string;
}


export interface ProjectGroup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  groupId: string;
  repositoryUrl?: string;
  status?: string;
  assignedEngineerId?: string;
  assignedEngineer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  projectGroupName?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Script {
  id: string;
  deploymentId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  name: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  deployedAt: string;
  engineerId: string;
  engineer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  description: string;
  services?: string;
  scripts?: Script[];
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  projectGroupName?: string;
}

export interface DeploymentService {
  id: string;
  deploymentId: string;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// State types
export interface AppState {
  projects: Project[];
  deployments: Deployment[];
  projectGroups: ProjectGroup[];
  engineers: Engineer[];
  services: Service[];
  scripts: Script[];
  deploymentServices: DeploymentService[];
  loading: {
    projects: boolean;
    deployments: boolean;
    projectGroups: boolean;
    engineers: boolean;
    services: boolean;
  };
  error: {
    projects: string | null;
    deployments: string | null;
    projectGroups: string | null;
    engineers: string | null;
    services: string | null;
  };
}

// Action types
export type AppAction =
  // Loading actions
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AppState['error']; error: string | null } }
  
  // Project actions
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  
  // Deployment actions
  | { type: 'SET_DEPLOYMENTS'; payload: Deployment[] }
  | { type: 'ADD_DEPLOYMENT'; payload: Deployment }
  | { type: 'UPDATE_DEPLOYMENT'; payload: Deployment }
  | { type: 'DELETE_DEPLOYMENT'; payload: string }
  
  // Project Group actions
  | { type: 'SET_PROJECT_GROUPS'; payload: ProjectGroup[] }
  | { type: 'ADD_PROJECT_GROUP'; payload: ProjectGroup }
  | { type: 'UPDATE_PROJECT_GROUP'; payload: ProjectGroup }
  | { type: 'DELETE_PROJECT_GROUP'; payload: string }
  
  // Engineer actions
  | { type: 'SET_ENGINEERS'; payload: Engineer[] }
  
  // Service actions
  | { type: 'SET_SERVICES'; payload: Service[] }
  
  // Script actions
  | { type: 'SET_SCRIPTS'; payload: Script[] }
  
  // Deployment Service actions
  | { type: 'SET_DEPLOYMENT_SERVICES'; payload: DeploymentService[] };

// Form types
export interface ProjectFormData {
  name: string;
  description?: string;
  groupId: string;
  repositoryUrl?: string;
  status?: string;
}

export interface DeploymentFormData {
  projectId: string;
  status: Deployment['status'];
  notes: string;
  services: string;
}

export interface ProjectGroupFormData {
  name: string;
  description: string;
}

// Component prop types
export interface NavigationProps {
  onNavigate: (view: string, groupId?: string, projectId?: string) => void;
}

// Authentication types
export type UserRole = 'Admin' | 'User';

export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface UserPermissionsSet {
  maintenance_requests?: UserPermissions;
  projects?: UserPermissions;
  deployments?: UserPermissions;
  users?: UserPermissions;
  project_groups?: UserPermissions;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: UserPermissionsSet;
}

// Maintenance Request System Types
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceCategory = 'Hardware' | 'Software' | 'Network' | 'General';
export type MaintenanceStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type AttachmentType = 'Document' | 'Image' | 'Before Photo' | 'After Photo' | 'Other';

export interface MaintenanceRequest {
  id: string;
  requestNumber: string;

  // Client Information
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;

  // Request Details
  title: string;
  description: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;

  // Scheduling
  requestedDate?: string;
  scheduledDate?: string;
  completedDate?: string;

  // Assignment
  assignedEngineerId?: string;
  assignedEngineer?: User;
  createdById?: string;
  createdBy?: User;

  // Status
  status: MaintenanceStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Related data (populated when needed)
  attachments?: MaintenanceAttachment[];
  workLogs?: MaintenanceWorkLog[];
  statusHistory?: MaintenanceStatusHistory[];
}

export interface MaintenanceStatusHistory {
  id: string;
  requestId: string;
  oldStatus?: MaintenanceStatus;
  newStatus: MaintenanceStatus;
  changedById?: string;
  changedBy?: User;
  changeReason?: string;
  createdAt: string;
}

export interface MaintenanceWorkLog {
  id: string;
  requestId: string;
  authorId: string;
  author: User;
  entryType: string;
  title?: string;
  description: string;
  hoursWorked: number;
  createdAt: string;
}

export interface MaintenanceAttachment {
  id: string;
  requestId: string;
  uploadedById: string;
  uploadedBy: User;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  attachmentType: AttachmentType;
  description?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
  message: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface RegistrationResponse {
  user: User;
  token?: string;
  expiresAt?: string;
  message: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: string;
  createdAt: string;
  lastAccessed: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Utility types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Specific type for deployment creation where deployedAt is optional (auto-populated by backend)
export type CreateDeploymentInput = Omit<Deployment, 'id' | 'createdAt' | 'updatedAt' | 'deployedAt' | 'scripts'> & {
  deployedAt?: string;
  scripts?: { title: string; content: string; }[];
};
