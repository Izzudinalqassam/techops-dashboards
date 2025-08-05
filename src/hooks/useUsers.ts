import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { userService, CreateUserData, UpdateUserData, ChangeUserPasswordData } from '../services/userService';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<User>;
  updateUser: (id: string, userData: UpdateUserData) => Promise<User>;
  deleteUser: (id: string) => Promise<{ success: boolean; message: string }>;
  changeUserPassword: (id: string, passwordData: ChangeUserPasswordData) => Promise<void>;
  getUserStats: () => Promise<any>;
  clearError: () => void;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new user
  const createUser = useCallback(async (userData: CreateUserData): Promise<User> => {
    setError(null);
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (id: string, userData: UpdateUserData): Promise<User> => {
    setError(null);
    try {
      const updatedUser = await userService.updateUser(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete user with enhanced error handling and loading state
  const deleteUser = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    setError(null);
    setLoading(true);

    try {
      const result = await userService.deleteUser(id);

      // Only update state if deletion was successful
      if (result.success) {
        setUsers(prev => prev.filter(user => user.id !== id));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);

      // Return structured error response
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Change user password
  const changeUserPassword = useCallback(async (id: string, passwordData: ChangeUserPasswordData): Promise<void> => {
    setError(null);
    try {
      await userService.changeUserPassword(id, passwordData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change user password';
      setError(errorMessage);
      throw err;
    }
  }, []);



  // Get user statistics
  const getUserStats = useCallback(async () => {
    setError(null);
    try {
      return await userService.getUserStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user statistics';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch removed to prevent infinite loops
  // Users should be fetched explicitly when needed by components

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    getUserStats,
    clearError,
  };
};
