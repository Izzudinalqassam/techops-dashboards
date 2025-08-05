import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { User, UserRole } from '../types';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface ChangeUserPasswordData {
  newPassword: string;
  confirmPassword: string;
}

export class UserService {
  private baseUrl = API_ENDPOINTS.USERS;

  // Convert database row to User object (matching your PostgreSQL schema)
  private mapRowToUser(row: any): User {
    return {
      id: row.id.toString(), // Convert INTEGER to string for frontend compatibility
      username: row.username,
      email: row.email,
      firstName: row.firstName || row.first_name,
      lastName: row.lastName || row.last_name,
      role: row.role,
      lastLogin: row.lastLogin || row.last_login,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at
    };
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<{users: any[], total: number}>(this.baseUrl);
      
      // Check if response and users array exist
      if (!response || !response.users) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Map database rows to User objects
      return response.users.map(row => this.mapRowToUser(row));
    } catch (error: any) {
      console.error('UserService.getAllUsers error:', error);
      
      // Handle specific error types
      if (error.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.status === 403) {
        throw new Error('Access denied. Administrator privileges required.');
      } else if (error.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch users. Please check your connection.');
      }
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiService.get<any>(`${this.baseUrl}/${id}`);
      return this.mapRowToUser(response);
    } catch (error) {
      console.error('UserService.getUserById error:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Create new user (admin only)
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Transform frontend data to match database schema
      const dbUserData = {
        username: userData.username,
        email: userData.email,
        password: userData.password, // Backend will hash this
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      };

      const response = await apiService.post<{message: string, user: any}>(this.baseUrl, dbUserData);
      return this.mapRowToUser(response.user);
    } catch (error) {
      console.error('UserService.createUser error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create user');
    }
  }

  // Update user (admin only)
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      // Transform frontend data to match database schema
      const dbUserData: any = {};

      if (userData.username !== undefined) dbUserData.username = userData.username;
      if (userData.email !== undefined) dbUserData.email = userData.email;
      if (userData.firstName !== undefined) dbUserData.firstName = userData.firstName;
      if (userData.lastName !== undefined) dbUserData.lastName = userData.lastName;
      if (userData.role !== undefined) dbUserData.role = userData.role;

      const response = await apiService.put<{message: string, user: any}>(`${this.baseUrl}/${id}`, dbUserData);
      return this.mapRowToUser(response.user);
    } catch (error) {
      console.error('UserService.updateUser error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update user');
    }
  }

  // Delete user (admin only) with enhanced error handling
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiService.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error: any) {
      console.error('UserService.deleteUser error:', error);

      // Extract error message from backend response
      let errorMessage = 'Failed to delete user';

      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.data && error.data.error) {
        errorMessage = error.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific HTTP status codes
      if (error.status === 404) {
        throw new Error(errorMessage || 'User not found or has already been deleted');
      } else if (error.status === 400) {
        throw new Error(errorMessage || 'Cannot delete user');
      } else if (error.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      } else if (error.status === 403) {
        throw new Error('Forbidden: You do not have permission to delete users');
      } else if (error.status >= 500) {
        throw new Error(errorMessage || 'Server error: Please try again later');
      } else if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(errorMessage);
      }
    }
  }

  // Change user password (admin only)
  async changeUserPassword(id: string, passwordData: ChangeUserPasswordData): Promise<void> {
    try {
      await apiService.put(`${this.baseUrl}/${id}/password`, passwordData);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to change user password');
    }
  }



  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    adminUsers: number;
    managerUsers: number;
    regularUsers: number;
    guestUsers: number;
  }> {
    try {
      const response = await apiService.get<any>(`${this.baseUrl}/stats`);
      return response;
    } catch (error) {
      throw new Error('Failed to fetch user statistics');
    }
  }


}

export const userService = new UserService();
