import React, { useState, useRef, useEffect } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { Deployment } from "../../types";

interface InlineStatusEditorProps {
  deployment: Deployment;
  onStatusUpdate: (
    deploymentId: string,
    newStatus: Deployment["status"]
  ) => Promise<void>;
  disabled?: boolean;
}

const statusOptions: Deployment["status"][] = [
  "pending",
  "running",
  "completed",
  "failed",
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  running: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const InlineStatusEditor: React.FC<InlineStatusEditorProps> = ({
  deployment,
  onStatusUpdate,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Deployment["status"]>(
    deployment.status
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selectedStatus when deployment.status changes
  useEffect(() => {
    setSelectedStatus(deployment.status);
  }, [deployment.status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditing(false);
        setSelectedStatus(deployment.status); // Reset to original status
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, deployment.status]);

  const handleStatusClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setSelectedStatus(deployment.status);
    }
  };

  const handleStatusSelect = (status: Deployment["status"]) => {
    setSelectedStatus(status);
  };

  const handleSave = async () => {
    if (selectedStatus === deployment.status) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      await onStatusUpdate(deployment.id, selectedStatus);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      setSelectedStatus(deployment.status); // Reset to original status
      // You could show a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(deployment.status);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div ref={dropdownRef} className="relative inline-block">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-2 min-w-[140px]">
          <div className="space-y-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`
                  w-full text-left px-3 py-2 rounded text-sm transition-colors
                  ${
                    selectedStatus === status
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
              title="Save"
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStatusClick}
      disabled={disabled}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
        ${statusColors[deployment.status]}
        ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:opacity-80 transition-opacity"
        }
      `}
      title={disabled ? "Status editing disabled" : "Click to edit status"}
    >
      <span>{statusLabels[deployment.status]}</span>
      {!disabled && <ChevronDown className="ml-1 h-3 w-3" />}
    </button>
  );
};

export default InlineStatusEditor;
