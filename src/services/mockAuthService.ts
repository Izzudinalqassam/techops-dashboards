import { LoginCredentials, AuthResponse, User } from '../types';

// Mock users for development
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@dashboard.local',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'Admin', // Updated to match backend expectations
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'john.doe',
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'Manager', // Updated to match backend expectations
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    username: 'jane.smith',
    email: 'jane.smith@company.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'User', // Updated to match backend expectations
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

export class MockAuthService {
  private tokenKey = 'dashboard_auth_token';
  private userKey = 'dashboard_user';

  // Simulate network delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate mock JWT token
  private generateMockToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // Simple base64 encoding for mock token (not secure, just for demo)
    return `mock.${btoa(JSON.stringify(payload))}.signature`;
  }

  // Mock login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔄 Mock Authentication: Attempting login...');
    
    await this.delay(800); // Simulate network delay

    const { email, password } = credentials;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password (in mock mode, accept 'admin123' for all users)
    if (password !== 'admin123') {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been disabled. Please contact support.');
    }

    // Generate token
    const token = this.generateMockToken(user);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Store token and user data
    this.setToken(token);
    this.setUser(user);

    console.log('✅ Mock Authentication: Login successful', { user: user.email, role: user.role });

    return {
      user,
      token,
      expiresAt,
      message: 'Login successful'
    };
  }

  // Mock logout
  async logout(): Promise<void> {
    console.log('🔄 Mock Authentication: Logging out...');
    await this.delay(200);
    
    this.clearAuth();
    console.log('✅ Mock Authentication: Logout successful');
  }

  // Mock token refresh
  async refreshToken(): Promise<AuthResponse> {
    console.log('🔄 Mock Authentication: Refreshing token...');
    await this.delay(300);

    const user = this.getUser();
    if (!user) {
      throw new Error('No user found for token refresh');
    }

    const token = this.generateMockToken(user);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    this.setToken(token);

    console.log('✅ Mock Authentication: Token refreshed');

    return {
      user,
      token,
      expiresAt,
      message: 'Token refreshed successfully'
    };
  }

  // Mock get current user
  async getCurrentUser(): Promise<User> {
    console.log('🔄 Mock Authentication: Getting current user...');
    await this.delay(200);

    const user = this.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    console.log('✅ Mock Authentication: Current user retrieved');
    return user;
  }

  // Mock update profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    console.log('🔄 Mock Authentication: Updating profile...');
    await this.delay(500);

    const user = this.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Update user data
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date().toISOString()
    };

    this.setUser(updatedUser);

    console.log('✅ Mock Authentication: Profile updated');
    return updatedUser;
  }

  // Mock change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    console.log('🔄 Mock Authentication: Changing password...');
    await this.delay(600);

    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    if (currentPassword !== 'admin123') {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    console.log('✅ Mock Authentication: Password changed successfully');
  }

  // Token management (same as real auth service)
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode mock token
      const parts = token.split('.');
      if (parts.length !== 3 || parts[0] !== 'mock') return true;
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user?.role || null;
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin'); // Backend expects 'Admin' with capital A
  }

  isManager(): boolean {
    const role = this.getUserRole();
    return role === 'Admin' || role === 'Manager'; // Backend expects capitalized roles
  }

  // Mock interceptor setup (no-op for mock mode)
  setupInterceptors(): void {
    console.log('🔧 Mock Authentication: Interceptors setup (mock mode)');
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();
export default mockAuthService;
