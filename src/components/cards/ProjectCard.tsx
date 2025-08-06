import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import {
  Server,
  Edit,
  Rocket,
  MoreVertical,
  Calendar,
  User,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import StatusBadge from "../ui/StatusBadge";
import { Project, ProjectGroup, Engineer, Deployment } from "../../types";

interface ProjectCardProps {
  project: Project;
  projectGroup?: ProjectGroup;
  engineer?: Engineer;
  lastDeployment?: Deployment;
  deploymentCount?: number;
  deployments?: Deployment[];
  onEdit?: (project: Project) => void;
  onDeploy?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewDeployments?: (project: Project) => void;
  // Bulk selection props
  isSelected?: boolean;
  onToggleSelect?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  projectGroup,
  engineer,
  lastDeployment,
  deploymentCount = 0,
  deployments = [],
  onEdit,
  onDeploy,
  onDelete,
  onViewDeployments,
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
    onDelete?.(project);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleCardClick = () => {
    if (onViewDeployments) {
      onViewDeployments(project);
    }
  };

  return (
    <Card hover className="group cursor-pointer" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              {projectGroup && (
                <p className="text-sm text-gray-500">{projectGroup.name}</p>
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
                  onToggleSelect(project.id);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            <StatusBadge status={project.status as any} size="sm" />
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500">Engineer:</span>
              <span className="ml-1 font-medium text-gray-900">
                {engineer
                  ? `${engineer.firstName} ${engineer.lastName}`
                  : "Unassigned"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500">Last Deploy:</span>
              <span className="ml-1 font-medium text-gray-900">
                {lastDeployment
                  ? formatRelativeTime(lastDeployment.deployedAt)
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Deployments Section */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Recent Deployments
            </h4>
            {deploymentCount > 0 && (
              <span className="text-xs text-gray-500">
                {deploymentCount} total
              </span>
            )}
          </div>

          {deployments.length === 0 ? (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <span className="text-sm text-gray-500">No deployments</span>
            </div>
          ) : (
            <div className="space-y-2">
              {deployments.slice(0, 3).map((deployment) => (
                <div
                  key={deployment.id}
                  className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <StatusBadge status={deployment.status} size="sm" />
                    <span className="text-sm text-gray-600 truncate">
                      {deployment.name || "Unnamed deployment"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {formatRelativeTime(deployment.deployedAt)}
                  </span>
                </div>
              ))}

              {deployments.length > 3 && (
                <div className="text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDeployments?.(project);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    +{deployments.length - 3} more deployments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex space-x-2">
          {shouldShowEditButton("project") && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(project);
              }}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeploy?.(project);
            }}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            <Rocket className="w-4 h-4 mr-1" />
            Deploy
          </button>
          {onDelete && shouldShowDeleteButton("project") && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
              title="Delete project"
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
                    Delete Project
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete project{" "}
                  <strong>{project.name}</strong>
                  {projectGroup && (
                    <span>
                      {" "}
                      from <strong>{projectGroup.name}</strong>
                    </span>
                  )}
                  ?
                </p>

                {deploymentCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-amber-600 text-xs font-bold">
                          !
                        </span>
                      </div>
                      <p className="text-sm text-amber-800">
                        <strong>Warning:</strong> This project has{" "}
                        {deploymentCount}{" "}
                        {deploymentCount === 1 ? "deployment" : "deployments"}.
                        You must delete {deploymentCount === 1 ? "it" : "them"}{" "}
                        first.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deploymentCount > 0}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md transition-colors ${
                    deploymentCount > 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
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

export default ProjectCard;
