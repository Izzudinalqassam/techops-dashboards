import React, { useState, useEffect } from "react";
import { X, Plus, Server, Rocket, Users } from "lucide-react";
import Button from "../ui/Button";
import {
  useProjects,
  useDeployments,
  useProjectGroups,
  useEngineers,
  useAppContext,
} from "../../hooks";
import { useNotification } from "../../contexts/NotificationContext";
import { CreateInput, Project, Deployment, ProjectGroup } from "../../types";
import { apiService } from "../../services/apiService";
import { API_ENDPOINTS } from "../../config/api";

export type QuickCreateType = "project" | "deployment" | "project-group";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: QuickCreateType;
  context?: {
    groupId?: string;
    groupName?: string;
    projectId?: string;
    projectName?: string;
  };
}

interface QuickCreateFormProps {
  type: QuickCreateType;
  context?: QuickCreateModalProps["context"];
  onSuccess: () => void;
  onCancel: () => void;
}

const QuickCreateForm: React.FC<QuickCreateFormProps> = ({
  type,
  context,
  onSuccess,
  onCancel,
}) => {
  const { createProject } = useProjects();
  const { createDeployment } = useDeployments();
  const { createProjectGroup } = useProjectGroups();
  const { engineers } = useEngineers();
  const { state } = useAppContext();
  const { showSuccess } = useNotification();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Engineers data is now accessed via useEngineers hook from global state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (type) {
        case "project":
          if (!formData.name) {
            throw new Error("Project name is required");
          }
          if (!formData.engineerId && engineers.length === 0) {
            throw new Error(
              "No engineers available. Please ensure at least one user is registered."
            );
          }

          await createProject({
            name: formData.name,
            description: formData.description || "",
            group_id: context?.groupId || formData.groupId,
            repository_url: formData.repositoryUrl || "",
            status: "active",
            assigned_engineer_id: formData.engineerId || engineers[0]?.id,
          } as CreateInput<Project>);

          showSuccess(
            "Project created successfully!",
            `Project "${formData.name}" has been created and is ready for deployments.`
          );
          break;

        case "deployment":
          if (!formData.name) {
            throw new Error("Deployment name is required");
          }
          if (!context?.projectId && !formData.projectId) {
            throw new Error("Project ID is required");
          }
          if (!formData.engineerId && engineers.length === 0) {
            throw new Error(
              "No engineers available. Please ensure at least one user is registered."
            );
          }

          await createDeployment({
            name: formData.name,
            projectId: context?.projectId || formData.projectId,
            status: formData.status || "pending",
            deployedAt: formData.deployedAt
              ? (() => {
                  // Convert datetime-local value to UTC
                  // The datetime-local input gives us "2025-08-03T06:37"
                  // We need to treat this as Jakarta time and convert to UTC
                  const [datePart, timePart] = formData.deployedAt.split("T");
                  const [year, month, day] = datePart.split("-").map(Number);
                  const [hour, minute] = timePart.split(":").map(Number);

                  // Create a date in Jakarta timezone (UTC+7)
                  // We manually create UTC time by subtracting 7 hours from Jakarta time
                  const utcDateTime = new Date(
                    Date.UTC(year, month - 1, day, hour - 7, minute)
                  );
                  return utcDateTime.toISOString();
                })()
              : new Date().toISOString(),
            engineerId: formData.engineerId || engineers[0]?.id,
            description: formData.description || "",
            services: formData.services || "",
            scripts: formData.scripts || [],
          } as CreateInput<Deployment>);

          showSuccess(
            "Deployment created successfully!",
            `Deployment "${formData.name}" has been added and is now being tracked.`
          );
          break;

        case "project-group":
          if (!formData.name) {
            throw new Error("Group name is required");
          }

          await createProjectGroup({
            name: formData.name,
            description: formData.description || "",
          } as CreateInput<ProjectGroup>);

          showSuccess(
            "Project group created successfully!",
            `Project group "${formData.name}" has been created and is ready to organize projects.`
          );
          break;
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to create:", error);
      // You might want to show an error message to the user here
      alert(error instanceof Error ? error.message : "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (type) {
      case "project":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environment
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.environment || "Development"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    environment: e.target.value,
                  }))
                }
              >
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Group
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.groupId || context?.groupId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    groupId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select a project group</option>
                {state.projectGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Engineer
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.engineerId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    engineerId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select an engineer</option>
                {engineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.firstName} {engineer.lastName} (@
                    {engineer.username})
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case "deployment":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deployment Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter deployment name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.projectId || context?.projectId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select a project</option>
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.environment ? ` (${project.environment})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status || "pending"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                required
              >
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deployment Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={
                  formData.deployedAt ||
                  (() => {
                    // Get current Jakarta time for datetime-local input
                    const now = new Date();
                    // Convert current UTC time to Jakarta time (UTC+7)
                    const jakartaTime = new Date(
                      now.getTime() + 7 * 60 * 60 * 1000
                    );
                    return jakartaTime.toISOString().slice(0, 16);
                  })()
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deployedAt: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Engineer
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.engineerId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    engineerId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select an engineer</option>
                {engineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.firstName} {engineer.lastName} (@
                    {engineer.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Services Used
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.services || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    services: e.target.value,
                  }))
                }
                placeholder="e.g., fremisn, postgre, and v4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this deployment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deployment Scripts
              </label>
              <div className="space-y-2">
                {(formData.scripts || []).map((script: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-md p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Script title"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={script.title || ""}
                        onChange={(e) => {
                          const newScripts = [...(formData.scripts || [])];
                          newScripts[index] = {
                            ...script,
                            title: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            scripts: newScripts,
                          }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newScripts = (formData.scripts || []).filter(
                            (_: any, i: number) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            scripts: newScripts,
                          }));
                        }}
                        className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Script content"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={script.content || ""}
                      onChange={(e) => {
                        const newScripts = [...(formData.scripts || [])];
                        newScripts[index] = {
                          ...script,
                          content: e.target.value,
                        };
                        setFormData((prev) => ({
                          ...prev,
                          scripts: newScripts,
                        }));
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newScripts = [
                      ...(formData.scripts || []),
                      { title: "", content: "" },
                    ];
                    setFormData((prev) => ({ ...prev, scripts: newScripts }));
                  }}
                  className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                >
                  + Add Script
                </button>
              </div>
            </div>
          </div>
        );

      case "project-group":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter group name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this project group..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderForm()}

      <div className="flex space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading} icon={Plus} className="flex-1">
          Create {type.replace("-", " ")}
        </Button>
      </div>
    </form>
  );
};

const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  type,
  context,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "project":
        return Server;
      case "deployment":
        return Rocket;
      case "project-group":
        return Users;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "project":
        return "Create New Project";
      case "deployment":
        return "Create New Deployment";
      case "project-group":
        return "Create New Project Group";
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getTitle()}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {context && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {context.groupName && `Creating in group: ${context.groupName}`}
                {context.projectName &&
                  `Creating for project: ${context.projectName}`}
              </p>
            </div>
          )}

          <QuickCreateForm
            type={type}
            context={context}
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickCreateModal;
