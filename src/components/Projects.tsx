import React, { useState } from "react";
import {
  Server,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { API_CONFIG } from '../config/api';
import { ensureArray } from "../utils/arrayValidation";

// Confirmation Dialog Component
const ConfirmationDialog = ({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <X className="h-4 w-4 mr-1 inline" /> Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
        >
          <Check className="h-4 w-4 mr-1" /> Confirm
        </button>
      </div>
    </div>
  </div>
);

interface ProjectsProps {
  data: any;
  selectedGroup?: string | null;
  onNavigate: (view: string, groupId?: string, projectId?: string) => void;
}

const Projects: React.FC<ProjectsProps> = ({
  data,
  selectedGroup,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEnvironment, setFilterEnvironment] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  let filteredProjects = data.projects;

  if (selectedGroup) {
    filteredProjects = filteredProjects.filter(
      (p: any) => p.groupId === selectedGroup
    );
  }

  if (searchTerm) {
    filteredProjects = filteredProjects.filter((p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterEnvironment) {
    filteredProjects = filteredProjects.filter(
      (p: any) => p.environment === filterEnvironment
    );
  }

  const selectedGroupData = selectedGroup
    ? data.projectGroups.find((g: any) => g.id === selectedGroup)
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedGroupData
              ? `${selectedGroupData.name} Projects`
              : "All Projects"}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedGroupData
              ? selectedGroupData.description
              : "Manage all deployment projects"}
          </p>
        </div>
        <Link
          to={
            selectedGroup
              ? `/add-project?groupId=${selectedGroup}`
              : "/add-project"
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Environments</option>
            <option value="Development">Development</option>
            <option value="Staging">Staging</option>
            <option value="Production">Production</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: any) => {
          const engineer = ensureArray(data.engineers).find(
            (e: any) => e.id === project.engineerId
          );
          const group = ensureArray(data.projectGroups).find(
            (g: any) => g.id === project.groupId
          );
          const deploymentCount = data.deployments.filter(
            (d: any) => d.projectId === project.id
          ).length;
          const lastDeployment = data.deployments
            .filter((d: any) => d.projectId === project.id)
            .sort(
              (a: any, b: any) =>
                new Date(b.deployedAt).getTime() -
                new Date(a.deployedAt).getTime()
            )[0];

          return (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Server className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <div className="flex space-x-1">
                        <Link
                          to={`/projects/edit/${project.id}`}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit project"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setProjectToDelete(project.id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      project.environment === "Production"
                        ? "bg-red-100 text-red-800"
                        : project.environment === "Staging"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {project.environment}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{group?.name}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    {engineer?.fullName || `${engineer?.firstName} ${engineer?.lastName}`.trim() || engineer?.username}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {deploymentCount} deployments
                    </span>
                    {lastDeployment && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          lastDeployment.status === "Success"
                            ? "bg-green-100 text-green-800"
                            : lastDeployment.status === "Failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        Last: {lastDeployment.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 p-4">
                <Link
                  to={`/deployments?project=${project.id}`}
                  className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Deployments →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterEnvironment
              ? "Try adjusting your filters"
              : "Get started by creating your first project"}
          </p>
          <button
            onClick={() => onNavigate("add-project")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Project
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <ConfirmationDialog
          message="Are you sure you want to delete this project? This action cannot be undone."
          onConfirm={async () => {
            try {
              const API_BASE = API_CONFIG.BASE_URL;
              const response = await fetch(
                `${API_BASE}/projects/${projectToDelete}`,
                {
                  method: "DELETE",
                }
              );

              if (!response.ok) {
                throw new Error("Failed to delete project");
              }

              // Redirect to dashboard with success notification
              window.location.href = "/?success=project-deleted";
            } catch (error) {
              console.error("Error deleting project:", error);
              alert("Failed to delete project. Please try again.");
              setProjectToDelete(null);
            }
          }}
          onCancel={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
};

export default Projects;
