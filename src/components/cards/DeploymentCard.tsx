import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import {
  Rocket,
  Edit,
  MoreVertical,
  Calendar,
  User,
  Server,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import StatusBadge from "../ui/StatusBadge";
import InlineStatusEditor from "../ui/InlineStatusEditor";
import { Deployment, Project, Engineer } from "../../types";

interface DeploymentCardProps {
  deployment: Deployment;
  project?: Project;
  engineer?: Engineer;
  onEdit?: (deployment: Deployment) => void;
  onView?: (deployment: Deployment) => void;
  onDelete?: (deployment: Deployment) => void;
  onStatusUpdate?: (
    deploymentId: string,
    newStatus: Deployment["status"]
  ) => Promise<void>;
  // Bulk selection props
  isSelected?: boolean;
  onToggleSelect?: (deploymentId: string) => void;
}

const DeploymentCard: React.FC<DeploymentCardProps> = ({
  deployment,
  project,
  engineer,
  onEdit,
  onView,
  onDelete,
  onStatusUpdate,
  isSelected = false,
  onToggleSelect,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { shouldShowDeleteButton, shouldShowEditButton } = usePermissions();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(deployment);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) {
      return { date: "Unknown", time: "Unknown" };
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { date: "Invalid Date", time: "Invalid Time" };
    }

    // Convert to Asia/Jakarta timezone (WIB)
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Jakarta",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    };
  };

  const { date, time } = formatDateTime(deployment.deployedAt);

  const getStatusIcon = () => {
    switch (deployment.status) {
      case "completed":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "failed":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case "running":
        return (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        );
      case "pending":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <Card hover className="group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <Link
                  to={`/deployments/${deployment.id}`}
                  className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                >
                  {deployment.name ||
                    `Deployment #${String(deployment.id).slice(-6)}`}
                </Link>
              </div>
              {project && (
                <p className="text-sm text-gray-500 flex items-center space-x-1">
                  <Server className="w-3 h-3" />
                  <span>{project.name}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect(deployment.id);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            {onStatusUpdate ? (
              <InlineStatusEditor
                key={`${deployment.id}-${deployment.status}`}
                deployment={deployment}
                onStatusUpdate={onStatusUpdate}
              />
            ) : (
              <StatusBadge status={deployment.status} size="sm" />
            )}
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {deployment.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {deployment.description}
            </p>
          )}

          {deployment.services && (
            <div className="flex items-start space-x-2">
              <Server className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-sm text-gray-500">Services:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {deployment.services.split(",").map((service, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {service.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{date}</div>
                <div className="text-gray-500">{time}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">By:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {engineer
                    ? engineer.fullName ||
                      `${engineer.firstName} ${engineer.lastName}`.trim() ||
                      engineer.username
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Status-specific additional info */}
          {deployment.status === "failed" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Deployment failed. Check logs for details.
              </p>
            </div>
          )}

          {deployment.status === "running" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-800">
                  Deployment in progress...
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex space-x-2">
          <button
            onClick={() => onView?.(deployment)}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Details
          </button>
          {shouldShowEditButton("deployment") && (
            <button
              onClick={() => onEdit?.(deployment)}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
          {onDelete && shouldShowDeleteButton("deployment") && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
              title="Delete deployment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Deployment
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete deployment{" "}
                <strong>#{String(deployment.id).slice(-6)}</strong>
                {project && (
                  <span>
                    {" "}
                    for <strong>{project.name}</strong>
                  </span>
                )}
                ?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default DeploymentCard;
