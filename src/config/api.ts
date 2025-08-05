// Helper function to safely parse environment variables
const getEnvVar = (key: keyof ImportMetaEnv, defaultValue: string): string => {
  try {
    return import.meta.env[key] || defaultValue;
  } catch (error) {
    console.warn(`Failed to read environment variable ${key}, using default: ${defaultValue}`);
    return defaultValue;
  }
};

const getEnvNumber = (key: keyof ImportMetaEnv, defaultValue: number): number => {
  try {
    const value = import.meta.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    console.warn(`Failed to parse environment variable ${key} as number, using default: ${defaultValue}`);
    return defaultValue;
  }
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001'),
  TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 10000), // 10 seconds
  RETRY_ATTEMPTS: getEnvNumber('VITE_API_RETRY_ATTEMPTS', 3),
  RETRY_DELAY: getEnvNumber('VITE_API_RETRY_DELAY', 1000), // 1 second
} as const;

// Validate API configuration
export const validateApiConfig = (): void => {
  const { BASE_URL, TIMEOUT, RETRY_ATTEMPTS, RETRY_DELAY } = API_CONFIG;

  if (!BASE_URL) {
    throw new Error('API_CONFIG.BASE_URL is required');
  }

  if (TIMEOUT <= 0) {
    throw new Error('API_CONFIG.TIMEOUT must be greater than 0');
  }

  if (RETRY_ATTEMPTS < 0) {
    throw new Error('API_CONFIG.RETRY_ATTEMPTS must be 0 or greater');
  }

  if (RETRY_DELAY < 0) {
    throw new Error('API_CONFIG.RETRY_DELAY must be 0 or greater');
  }

  // Log configuration in development
  if (import.meta.env.DEV) {
    console.log('API Configuration:', {
      BASE_URL,
      TIMEOUT,
      RETRY_ATTEMPTS,
      RETRY_DELAY,
    });
  }
};

// Validate configuration on module load
validateApiConfig();

// API Endpoints
export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  DEPLOYMENTS: '/api/deployments',
  PROJECT_GROUPS: '/api/project-groups',
  ENGINEERS: '/api/engineers',
  SERVICES: '/api/services',
  SCRIPTS: '/api/scripts',
  DEPLOYMENT_SERVICES: '/api/deployment-services',
  USERS: '/api/users',
  MAINTENANCE: '/api/admin/maintenance',
  MIGRATIONS: '/api/admin/migrate',

  HEALTH: '/api/health',
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Request/Response types
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface ApiRequestOptions {
  method?: keyof typeof HTTP_METHODS;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
