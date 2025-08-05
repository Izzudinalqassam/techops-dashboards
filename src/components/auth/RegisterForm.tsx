import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Server,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useDatabaseConnectionContext } from "../../contexts/DatabaseConnectionContext";
import { DatabaseConnectionError } from "../../services/apiService";
import Button from "../ui/Button";
import { RegisterCredentials } from "../../types";

// Error type classification
type ErrorType = "network" | "server" | "validation" | "conflict" | "unknown";

interface RegistrationError {
  type: ErrorType;
  message: string;
  icon: React.ComponentType<any>;
  color: string;
}

// Password strength levels
type PasswordStrength = "weak" | "medium" | "strong";

interface PasswordValidation {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterCredentials>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] =
    useState<RegistrationError | null>(null);
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidation | null>(null);

  const { state, register, login, clearError } = useAuth();
  const { showNotification, showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  // Classify error type and provide appropriate messaging
  const classifyError = (error: Error): RegistrationError => {
    // Check for database connectivity errors first
    if (
      error instanceof DatabaseConnectionError ||
      (error as any)?.isDatabaseError
    ) {
      return {
        type: "server",
        message:
          "Database connection issue. Please wait a moment and try again.",
        icon: Server,
        color: "text-red-600",
      };
    }

    const message = error.message.toLowerCase();

    // Check for specific validation errors from backend
    if (message.includes("validation failed:")) {
      return {
        type: "validation",
        message: error.message, // Use the detailed message from backend
        icon: AlertCircle,
        color: "text-yellow-600",
      };
    }

    if (
      message.includes("connect") ||
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("database")
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
      message.includes("404") ||
      message.includes("500")
    ) {
      return {
        type: "server",
        message:
          "Registration service is temporarily unavailable. Please try again later.",
        icon: Server,
        color: "text-red-600",
      };
    }

    if (
      message.includes("already exists") ||
      message.includes("duplicate") ||
      message.includes("conflict")
    ) {
      return {
        type: "conflict",
        message:
          "An account with this email or username already exists. Please use different credentials.",
        icon: AlertCircle,
        color: "text-red-600",
      };
    }

    if (
      message.includes("required") ||
      message.includes("validation") ||
      message.includes("invalid")
    ) {
      return {
        type: "validation",
        message:
          "Please check all fields and ensure they meet the requirements.",
        icon: AlertCircle,
        color: "text-yellow-600",
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

  // Validate password strength
  const validatePassword = (password: string): PasswordValidation => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include lowercase letters");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include uppercase letters");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include numbers");
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include special characters");
    }

    let strength: PasswordStrength = "weak";
    if (score >= 4) strength = "strong";
    else if (score >= 3) strength = "medium";

    return { strength, score, feedback };
  };

  // Clear errors when form data changes
  useEffect(() => {
    if (state.error || registrationError) {
      clearError();
      setRegistrationError(null);
    }
  }, [formData.email, formData.username]);

  // Validate password on change
  useEffect(() => {
    if (formData.password) {
      setPasswordValidation(validatePassword(formData.password));
    } else {
      setPasswordValidation(null);
    }
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): RegistrationError | null => {
    // Check required fields
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.username
    ) {
      return classifyError(new Error("Please fill in all required fields"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return classifyError(new Error("Please enter a valid email address"));
    }

    // Validate username (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      return classifyError(
        new Error("Username can only contain letters, numbers, and underscores")
      );
    }

    // Validate password strength
    if (passwordValidation && passwordValidation.score < 3) {
      return classifyError(
        new Error("Password is too weak. Please choose a stronger password.")
      );
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      return classifyError(new Error("Passwords do not match"));
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setRegistrationError(null);
    clearError();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setRegistrationError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Register user
      await register(formData);

      // Check if user was automatically logged in
      if (state.isAuthenticated) {
        showSuccess("Registration successful! Welcome to the dashboard.");
        navigate("/", { replace: true });
      } else {
        // Registration successful but need to login
        showSuccess(
          "Registration successful! Please log in with your new account."
        );

        // Automatically attempt login
        try {
          await login({
            email: formData.email,
            password: formData.password,
          });
          navigate("/", { replace: true });
        } catch (loginError) {
          // Login failed, redirect to login page
          navigate("/login", {
            state: {
              email: formData.email,
              message: "Registration successful! Please log in.",
            },
          });
        }
      }
    } catch (error) {
      const regErr =
        error instanceof Error ? error : new Error("Registration failed");
      const classifiedError = classifyError(regErr);
      setRegistrationError(classifiedError);

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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Letters, numbers, and underscores only
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
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
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
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
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
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

              {/* Password Strength Indicator */}
              {passwordValidation && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordValidation.strength === "strong"
                              ? "bg-green-500 w-full"
                              : passwordValidation.strength === "medium"
                              ? "bg-yellow-500 w-2/3"
                              : "bg-red-500 w-1/3"
                          }`}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordValidation.strength === "strong"
                          ? "text-green-600"
                          : passwordValidation.strength === "medium"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordValidation.strength.charAt(0).toUpperCase() +
                        passwordValidation.strength.slice(1)}
                    </span>
                  </div>
                  {passwordValidation.feedback.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-600">
                      {passwordValidation.feedback.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-1 flex items-center space-x-1">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Error Message */}
          {(registrationError || state.error) && (
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border ${
                registrationError?.type === "network"
                  ? "bg-orange-50 border-orange-200"
                  : registrationError?.type === "server"
                  ? "bg-red-50 border-red-200"
                  : registrationError?.type === "conflict"
                  ? "bg-red-50 border-red-200"
                  : registrationError?.type === "validation"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {registrationError ? (
                <registrationError.icon
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${registrationError.color}`}
                />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    registrationError?.type === "network"
                      ? "text-orange-800"
                      : registrationError?.type === "server"
                      ? "text-red-800"
                      : registrationError?.type === "conflict"
                      ? "text-red-800"
                      : registrationError?.type === "validation"
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  {registrationError ? registrationError.message : state.error}
                </p>

                {/* Additional help text for specific error types */}
                {registrationError?.type === "network" && (
                  <p className="text-xs text-orange-600 mt-1">
                    Check your internet connection and try again.
                  </p>
                )}
                {registrationError?.type === "server" && (
                  <p className="text-xs text-red-600 mt-1">
                    The registration service may be under maintenance. Please
                    try again in a few minutes.
                  </p>
                )}
                {registrationError?.type === "conflict" && (
                  <p className="text-xs text-red-600 mt-1">
                    Try using a different email address or username.
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
            disabled={
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword ||
              !formData.firstName ||
              !formData.lastName ||
              !formData.username ||
              formData.password !== formData.confirmPassword ||
              (passwordValidation?.score !== undefined &&
                passwordValidation.score < 3)
            }
            className="py-3"
          >
            {isSubmitting || state.isLoading
              ? "Creating account..."
              : "Create account"}
          </Button>

          {/* Terms and Privacy */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
