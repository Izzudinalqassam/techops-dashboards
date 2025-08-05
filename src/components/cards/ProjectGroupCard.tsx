import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import {
  Users,
  Edit,
  MoreVertical,
  Server,
  Rocket,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import { ProjectGroup, Project, Deployment } from "../../types";

interface ProjectGroupCardProps {
  projectGroup: ProjectGroup;
  projects?: Project[];
  deployments?: Deployment[];
  onEdit?: (group: ProjectGroup) => void;
  onAddProject?: (group: ProjectGroup) => void;
  onDelete?: (group: ProjectGroup) => void;
  onViewProjects?: (group: ProjectGroup) => void;
}

const ProjectGroupCard: React.FC<ProjectGroupCardProps> = ({
  projectGroup,
  projects = [],
  deployments = [],
  onEdit,
  onAddProject,
  onDelete,
  onViewProjects,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { shouldShowDeleteButton, shouldShowEditButton } = usePermissions();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(projectGroup);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const projectCount = projects.length;
  const recentDeployments = deployments
    .sort(
      (a, b) =>
        new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    )
    .slice(0, 3);

  const getStatusCounts = () => {
    const counts = projects.reduce((acc, project) => {
      const status = project.status || "active";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleCardClick = () => {
    if (onViewProjects) {
      onViewProjects(projectGroup);
    }
  };

  return (
    <Card hover className="group cursor-pointer" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {projectGroup.name}
              </h3>
              <p className="text-sm text-gray-500">
                {projectCount} {projectCount === 1 ? "project" : "projects"}
              </p>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {projectGroup.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {projectGroup.description}
            </p>
          )}

          {/* Project names */}
          {projectCount > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Projects ({projectCount})
              </h4>
              <div className="space-y-1">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700 truncate">
                      {project.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        project.status === "active"
                          ? "bg-green-500"
                          : project.status === "inactive"
                          ? "bg-red-500"
                          : project.status === "maintenance"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                      title={`Status: ${project.status || "active"}`}
                    />
                  </div>
                ))}
                {projectCount > 3 && (
                  <p className="text-xs text-gray-500">
                    +{projectCount - 3} more projects
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {recentDeployments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Recent Deployments
              </h4>
              <div className="space-y-1">
                {recentDeployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center space-x-2 text-xs"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        deployment.status === "Success"
                          ? "bg-green-500"
                          : deployment.status === "Failed"
                          ? "bg-red-500"
                          : deployment.status === "In Progress"
                          ? "bg-blue-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-gray-600 truncate">
                      {deployment.name ||
                        `Deployment #${String(deployment.id).slice(-6)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {projectCount === 0 && (
            <div className="text-center py-4">
              <Server className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No projects yet</p>
              <p className="text-xs text-gray-400">
                Add your first project to get started
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex space-x-2">
          {shouldShowEditButton("project_group") && (
            <button
              onClick={() => onEdit?.(projectGroup)}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Group
            </button>
          )}
          <button
            onClick={() => onAddProject?.(projectGroup)}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Project
          </button>
          {onDelete && shouldShowDeleteButton("project_group") && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
              title="Delete project group"
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
                    Delete Project Group
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete project group{" "}
                  <strong>{projectGroup.name}</strong>?
                </p>

                {projectCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-amber-600 text-xs font-bold">
                          !
                        </span>
                      </div>
                      <p className="text-sm text-amber-800">
                        <strong>Warning:</strong> This group contains{" "}
                        {projectCount}{" "}
                        {projectCount === 1 ? "project" : "projects"}. You must
                        move or delete {projectCount === 1 ? "it" : "them"}{" "}
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
                  disabled={projectCount > 0}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md transition-colors ${
                    projectCount > 0
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

export default ProjectGroupCard;
