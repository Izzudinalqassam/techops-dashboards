import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Wifi,
  WifiOff,
  Server,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import Button from "../ui/Button";
import { LoginCredentials } from "../../types";

// Error type classification
type ErrorType =
  | "network"
  | "server"
  | "credentials"
  | "validation"
  | "account"
  | "unknown";

interface LoginError {
  type: ErrorType;
  message: string;
  icon: React.ComponentType<any>;
  color: string;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);

  const { state, login, clearError } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Classify error type and provide appropriate messaging
  const classifyError = (error: Error): LoginError => {
    const message = error.message.toLowerCase();

    if (
      message.includes("connect") ||
      message.includes("network") ||
      message.includes("fetch")
    ) {
      return {
        type: "network",
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
        icon: WifiOff,
        color: "text-orange-600",
      };
    }

    if (
      message.includes("service is not available") ||
      message.includes("404")
    ) {
      return {
        type: "server",
        message:
          "Authentication service is temporarily unavailable. Please try again later.",
        icon: Server,
        color: "text-red-600",
      };
    }

    if (
      message.includes("invalid") ||
      message.includes("password") ||
      message.includes("credentials")
    ) {
      return {
        type: "credentials",
        message:
          "Invalid email or password. Please check your credentials and try again.",
        icon: AlertCircle,
        color: "text-red-600",
      };
    }

    if (message.includes("required") || message.includes("fill")) {
      return {
        type: "validation",
        message: "Please fill in all required fields correctly.",
        icon: AlertCircle,
        color: "text-yellow-600",
      };
    }

    if (message.includes("disabled") || message.includes("account")) {
      return {
        type: "account",
        message:
          "Your account has been disabled. Please contact support for assistance.",
        icon: AlertCircle,
        color: "text-red-600",
      };
    }

    return {
      type: "unknown",
      message:
        error.message || "An unexpected error occurred. Please try again.",
      icon: AlertCircle,
      color: "text-red-600",
    };
  };

  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || "/";

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    if (state.error || loginError) {
      clearError();
      setLoginError(null);
    }
  }, [formData.email, formData.password]);

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [state.isAuthenticated, navigate, from]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setLoginError(null);
    clearError();

    // Validate form
    if (!formData.email || !formData.password) {
      const validationError = new Error("Please fill in all required fields");
      setLoginError(classifyError(validationError));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const emailError = new Error("Please enter a valid email address");
      setLoginError(classifyError(emailError));
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData);
      showSuccess("Login successful! Welcome back.");
      navigate(from, { replace: true });
    } catch (error) {
      const loginErr =
        error instanceof Error ? error : new Error("Login failed");
      const classifiedError = classifyError(loginErr);
      setLoginError(classifiedError);

      // Also show notification for certain error types
      if (
        classifiedError.type === "network" ||
        classifiedError.type === "server"
      ) {
        showError(classifiedError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${state.error ? "border-red-300" : "border-gray-300"}
                    placeholder-gray-400
                  `}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`
                    block w-full pl-10 pr-10 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${state.error ? "border-red-300" : "border-gray-300"}
                    placeholder-gray-400
                  `}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Error Message */}
          {(loginError || state.error) && (
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border ${
                loginError?.type === "network"
                  ? "bg-orange-50 border-orange-200"
                  : loginError?.type === "server"
                  ? "bg-red-50 border-red-200"
                  : loginError?.type === "credentials"
                  ? "bg-red-50 border-red-200"
                  : loginError?.type === "validation"
                  ? "bg-yellow-50 border-yellow-200"
                  : loginError?.type === "account"
                  ? "bg-red-50 border-red-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {loginError ? (
                <loginError.icon
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${loginError.color}`}
                />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    loginError?.type === "network"
                      ? "text-orange-800"
                      : loginError?.type === "server"
                      ? "text-red-800"
                      : loginError?.type === "credentials"
                      ? "text-red-800"
                      : loginError?.type === "validation"
                      ? "text-yellow-800"
                      : loginError?.type === "account"
                      ? "text-red-800"
                      : "text-red-800"
                  }`}
                >
                  {loginError ? loginError.message : state.error}
                </p>

                {/* Additional help text for specific error types */}
                {loginError?.type === "network" && (
                  <p className="text-xs text-orange-600 mt-1">
                    Check your internet connection and try again.
                  </p>
                )}
                {loginError?.type === "server" && (
                  <p className="text-xs text-red-600 mt-1">
                    The authentication service may be under maintenance. Please
                    try again in a few minutes.
                  </p>
                )}
                {loginError?.type === "credentials" && (
                  <p className="text-xs text-red-600 mt-1">
                    Double-check your email and password. Use the demo
                    credentials below if needed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            loading={isSubmitting || state.isLoading}
            disabled={!formData.email || !formData.password}
            className="py-3"
          >
            {isSubmitting || state.isLoading ? "Signing in..." : "Sign in"}
          </Button>

          {/* Registration Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create one here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
