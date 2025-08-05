import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { LoginCredentials, AuthResponse, User, RegisterCredentials, RegistrationResponse } from '../types';
import { mockAuthService } from './mockAuthService';

// Check if we should use mock authentication
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true' ||
  import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL;

export class AuthService {
  private tokenKey = 'dashboard_auth_token';
  private userKey = 'dashboard_user';

  constructor() {
    // Authentication mode is determined by environment variables
    // Mock auth is used in development when no backend is configured
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      if (USE_MOCK_AUTH) {
        return await mockAuthService.login(credentials);
      }

      const response = await apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);

      // Store token and user data
      if (response.token) {
        this.setToken(response.token);
        this.setUser(response.user);
      }

      return response;
    } catch (error) {
      // Enhanced error handling with user-friendly messages
      throw this.handleAuthError(error, 'login');
    }
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<RegistrationResponse> {
    try {
      if (USE_MOCK_AUTH) {
        // For mock mode, simulate registration
        const mockUser: User = {
          id: Date.now().toString(),
          username: credentials.username,
          email: credentials.email,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          role: 'User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return {
          user: mockUser,
          message: 'Registration successful'
        };
      }

      const response = await apiService.post<RegistrationResponse>(API_ENDPOINTS.AUTH.REGISTER, {
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });

      // If registration includes automatic login (token provided)
      if (response.token) {
        this.setToken(response.token);
        this.setUser(response.user);
      }

      return response;
    } catch (error) {
      // Enhanced error handling with user-friendly messages
      throw this.handleAuthError(error, 'registration');
    }
  }

  // Enhanced error handling method
  private handleAuthError(error: any, operation: string): Error {
    console.error(`Auth ${operation} error:`, error);

    // Network/Server errors
    if (error.status === 404) {
      return new Error('Authentication service is not available. Please try again later or contact support.');
    }

    if (error.status === 500) {
      return new Error('Server error occurred. Please try again later.');
    }

    if (error.status === 503) {
      return new Error('Authentication service is temporarily unavailable. Please try again later.');
    }

    // Authentication specific errors
    if (error.status === 401) {
      if (operation === 'login') {
        return new Error('Invalid email or password. Please check your credentials and try again.');
      }
      if (operation === 'registration') {
        return new Error('Registration failed. Please check your information and try again.');
      }
      return new Error('Your session has expired. Please log in again.');
    }

    if (error.status === 400) {
      if (operation === 'registration') {
        return new Error('Please fill in all required fields correctly and ensure passwords match.');
      }
      return new Error('Please fill in all required fields correctly.');
    }

    if (error.status === 403) {
      return new Error('Your account does not have permission to access this service.');
    }

    if (error.status === 409) {
      if (operation === 'registration') {
        return new Error('An account with this email or username already exists. Please use different credentials.');
      }
      return new Error('A conflict occurred. Please try again.');
    }

    // Network connectivity errors
    if (!error.status || error.message?.includes('fetch')) {
      return new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }

    // Rate limiting
    if (error.status === 429) {
      return new Error('Too many login attempts. Please wait a few minutes before trying again.');
    }

    // Account specific errors
    if (error.message?.includes('disabled') || error.message?.includes('inactive')) {
      return new Error('Your account has been disabled. Please contact support for assistance.');
    }

    // Generic fallback
    return new Error(error.message || `An error occurred during ${operation}. Please try again.`);
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      if (USE_MOCK_AUTH) {
        await mockAuthService.logout();
        return;
      }

      // Call logout endpoint to invalidate session on server
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local storage
      this.clearAuth();
    }
  }

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    try {
      if (USE_MOCK_AUTH) {
        return await mockAuthService.refreshToken();
      }

      const response = await apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH);

      if (response.token) {
        this.setToken(response.token);
        this.setUser(response.user);
      }

      return response;
    } catch (error) {
      // If refresh fails, clear auth data
      this.clearAuth();
      throw this.handleAuthError(error, 'token refresh');
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    if (USE_MOCK_AUTH) {
      return await mockAuthService.getCurrentUser();
    }
    return apiService.get<User>(API_ENDPOINTS.AUTH.ME);
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (USE_MOCK_AUTH) {
      return await mockAuthService.updateProfile(userData);
    }
    const response = await apiService.put<User>(API_ENDPOINTS.AUTH.PROFILE, userData);
    this.setUser(response);
    return response;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      if (USE_MOCK_AUTH) {
        await mockAuthService.changePassword(currentPassword, newPassword);
        return;
      }

      await apiService.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });
    } catch (error) {
      throw this.handleAuthError(error, 'password change');
    }
  }

  // Token management
  setToken(token: string): void {
    if (USE_MOCK_AUTH) {
      mockAuthService.setToken(token);
    } else {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (USE_MOCK_AUTH) {
      return mockAuthService.getToken();
    }
    return localStorage.getItem(this.tokenKey);
  }

  // User data management
  setUser(user: User): void {
    if (USE_MOCK_AUTH) {
      mockAuthService.setUser(user);
    } else {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (USE_MOCK_AUTH) {
      return mockAuthService.getUser();
    }
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Clear all auth data
  clearAuth(): void {
    if (USE_MOCK_AUTH) {
      mockAuthService.clearAuth();
    } else {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (USE_MOCK_AUTH) {
      return mockAuthService.isAuthenticated();
    }
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check if token is expired (basic check)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      // If we can't decode the token, consider it expired
      return true;
    }
  }

  // Get user role
  getUserRole(): string | null {
    const user = this.getUser();
    return user?.role || null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if user has admin privileges
  isAdmin(): boolean {
    return this.hasRole('Admin'); // Backend expects 'Admin' with capital A
  }

  // Check if user has manager privileges (now only Admin)
  isManager(): boolean {
    const role = this.getUserRole();
    return role === 'Admin'; // Only Admin has manager privileges in simplified system
  }

  // Setup interceptors for automatic token attachment
  setupInterceptors(): void {
    try {
      // Request interceptor to add token
      apiService.interceptors.request.use((config) => {
        const token = this.getToken();
        if (token && !this.isTokenExpired()) {
          // Ensure headers object exists
          if (!config.headers) {
            config.headers = {};
          }
          // Set Authorization header properly
          config.headers['Authorization'] = `Bearer ${token}`;
          
          // Debug logging for development
          if (import.meta.env.DEV) {
            console.log('🔐 Adding auth token to request:', {
              url: config.url,
              hasToken: !!token,
              tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
            });
          }
        } else {
          // Debug logging when no token is available
          if (import.meta.env.DEV) {
            console.log('⚠️ No valid token available for request:', {
              url: config.url,
              hasToken: !!token,
              isExpired: token ? this.isTokenExpired() : 'no token'
            });
          }
        }
        return config;
      });

      // Response interceptor to handle token expiration
      apiService.interceptors.response.use(
        (response) => response,
        async (error) => {
          // Handle 401 errors for token refresh
          if (error.status === 401) {
            try {
              // Try to refresh token
              await this.refreshToken();
              // Note: In a real implementation, you'd want to retry the original request
              // For now, we'll just clear auth and redirect
            } catch (refreshError) {
              // Refresh failed, redirect to login
              this.clearAuth();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          }
          throw error;
        }
      );
    } catch (error) {
      console.warn('Failed to setup API interceptors:', error);
      // Don't throw error to prevent app crash
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
