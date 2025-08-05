import React from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Loader,
  Timer,
} from "lucide-react";

export type StatusType =
  | "Development"
  | "Staging"
  | "Production"
  | "Pending"
  | "pending"
  | "Success"
  | "Failed"
  | "failed"
  | "Running"
  | "running"
  | "completed"
  | "Active" // Changed from "isActive" to "Active"
  | "Inactive"
  | "On Hold"
  | "Completed"
  | "Cancelled"
  | "In Progress"
  | "Admin"
  | "User";

interface StatusBadgeProps {
  status: StatusType | undefined | null;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  Admin: {
    colors: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle, // Changed from Clock to CheckCircle for better representation
    label: "Admin",
  },
  User: {
    colors: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
    label: "User",
  },
  Development: {
    colors: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
    label: "Development",
  },
  Staging: {
    colors: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertTriangle,
    label: "Staging",
  },
  Production: {
    colors: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Production",
  },
  Pending: {
    colors: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Timer,
    label: "Pending",
  },
  pending: {
    colors: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Timer,
    label: "Pending",
  },
  Success: {
    colors: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
    label: "Success",
  },
  Failed: {
    colors: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Failed",
  },
  failed: {
    colors: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Failed",
  },
  running: {
    colors: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader,
    label: "Running",
  },
  Running: {
    colors: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader,
    label: "Running",
  },
  completed: {
    colors: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Completed",
  },
  "In Progress": {
    colors: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader,
    label: "In Progress",
  },
  "On Hold": {
    colors: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    label: "On Hold",
  },
  Completed: {
    colors: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Completed",
  },
  Cancelled: {
    colors: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Cancelled",
  },
  Active: {
    // Changed from "isActive" to "Active"
    colors: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Active",
  },
  Inactive: {
    colors: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Inactive",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-1 text-xs",
    icon: "w-3 h-3",
  },
  md: {
    container: "px-3 py-1 text-sm",
    icon: "w-4 h-4",
  },
  lg: {
    container: "px-4 py-2 text-base",
    icon: "w-5 h-5",
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const sizeStyles = sizeConfig[size];

  // Handle undefined, null, or unknown status with fallback
  if (!status || !statusConfig[status]) {
    if (status) {
      console.warn(
        `StatusBadge: Unknown status "${status}". Using fallback configuration.`
      );
    }
    const fallbackConfig = {
      colors: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Clock,
      label: status || "Unknown",
    };
    const Icon = fallbackConfig.icon;

    return (
      <span
        className={`
        inline-flex items-center font-medium rounded-full border
        ${fallbackConfig.colors}
        ${sizeStyles.container}
        ${className}
      `}
      >
        {showIcon && (
          <Icon
            className={`
            ${sizeStyles.icon}
            ${size !== "sm" ? "mr-1.5" : "mr-1"}
          `}
          />
        )}
        {fallbackConfig.label}
      </span>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`
      inline-flex items-center font-medium rounded-full border
      ${config.colors}
      ${sizeStyles.container}
      ${className}
    `}
    >
      {showIcon && (
        <Icon
          className={`
          ${sizeStyles.icon}
          ${size !== "sm" ? "mr-1.5" : "mr-1"}
          ${
            status === "In Progress" ||
            status === "running" ||
            status === "Running"
              ? "animate-spin"
              : ""
          }
        `}
        />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
