import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthState,
  User,
  LoginCredentials,
  AuthResponse,
  RegisterCredentials,
  RegistrationResponse,
} from "../types";
import { authService } from "../services/authService";

// Auth Actions
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_CLEAR_ERROR" }
  | { type: "AUTH_UPDATE_USER"; payload: User };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "AUTH_CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "AUTH_UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// Context interface
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  clearError: () => void;
  checkAuth: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    try {
      checkAuth();
      // Setup API interceptors
      authService.setupInterceptors();
    } catch (error) {
      console.error("Failed to initialize authentication:", error);
      // Don't crash the app, just log the error
    }
  }, []);

  // Check if user is authenticated
  const checkAuth = () => {
    try {
      const token = authService.getToken();
      const user = authService.getUser();

      if (token && user && !authService.isTokenExpired()) {
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, token },
        });
      } else {
        // Token expired or invalid, clear auth
        authService.clearAuth();
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      // Auth check failed, clear auth silently
      authService.clearAuth();
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response: AuthResponse = await authService.login(credentials);

      dispatch({
        type: "AUTH_SUCCESS",
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response: RegistrationResponse = await authService.register(
        credentials
      );

      // If registration includes automatic login (token provided)
      if (response.token) {
        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: response.user,
            token: response.token,
          },
        });
      } else {
        // Registration successful but no automatic login
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Update user profile
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({
        type: "AUTH_UPDATE_USER",
        payload: updatedUser,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Profile update failed";
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Change password
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Password change failed";
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: "AUTH_CLEAR_ERROR" });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
