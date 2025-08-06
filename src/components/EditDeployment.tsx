import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Rocket, Plus, X, Code } from "lucide-react";
import { convertToWIB, convertWIBToUTC } from "../utils/timezone";
import { ensureArray } from "../utils/arrayValidation";
import { apiService } from "../services/apiService";
import { Deployment, Script, Project, Engineer } from "../types";

interface EditDeploymentProps {
  data: {
    projects: Project[];
    engineers: Engineer[];
  };
  deploymentId: string;
  onNavigate: (view: string, projectId?: string) => void;
}



const EditDeployment: React.FC<EditDeploymentProps> = ({
  data,
  deploymentId,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    projectId: "",
    status: "pending",
    deployedAt: "",
    engineerId: "",
    description: "",
    services: "",
  });

  const [scripts, setScripts] = useState([{ title: "", content: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load deployment data
  useEffect(() => {
    const loadDeployment = async () => {
      try {
        const [deployment, scriptsData] = await Promise.all([
          apiService.get<Deployment>(`/deployments/${deploymentId}`),
          apiService.get<Script[]>(`/deployments/scripts?deploymentId=${deploymentId}`),
        ]);

        // Convert UTC timestamp to WIB for display in datetime-local input
        const wibDate = deployment.deployedAt
          ? convertToWIB(deployment.deployedAt)
          : null;
        const formattedDate = wibDate ? wibDate.toISOString().slice(0, 16) : "";

        setFormData({
          projectId: deployment.projectId,
          status: deployment.status,
          deployedAt: formattedDate,
          engineerId: deployment.engineerId || "",
          description: deployment.description || "",
          services: deployment.services || "",
        });

        setScripts(
          scriptsData.length > 0
            ? scriptsData.map((s: Script) => ({
                title: s.title,
                content: s.content,
              }))
            : [{ title: "", content: "" }]
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load deployment data";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeployment();
  }, [deploymentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Convert WIB datetime to UTC for backend
      const wibDate = new Date(formData.deployedAt);
      const utcDate = convertWIBToUTC(wibDate);
      if (!utcDate) {
        setError("Invalid datetime format");
        return;
      }

      const payload = {
        projectId: formData.projectId,
        status: formData.status,
        deployedAt: utcDate.toISOString(),
        engineerId: formData.engineerId,
        description: formData.description || "",
        scripts: scripts.filter((sc) => sc.title || sc.content),
        services: formData.services,
      };

      await apiService.put(`/deployments/${deploymentId}`, payload);

      // Navigate back to deployments page
      onNavigate("deployments");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update deployment";
      setError(errorMessage);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleScriptChange = (index: number, field: string, value: string) => {
    setScripts((prev) =>
      prev.map((script, i) =>
        i === index ? { ...script, [field]: value } : script
      )
    );
  };

  const addScript = () => {
    setScripts((prev) => [...prev, { title: "", content: "" }]);
  };

  const removeScript = (index: number) => {
    if (scripts.length > 1) {
      setScripts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading deployment data...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => onNavigate("deployments")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Deployments
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => onNavigate("deployments")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deployments
        </button>
        <div className="flex items-center mb-2">
          <div className="p-3 bg-blue-50 rounded-lg mr-4">
            <Rocket className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Deployment
            </h1>
            <p className="text-gray-600">
              Update deployment details and scripts
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a project</option>
                {data.projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                name="deployedAt"
                value={formData.deployedAt}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Engineer
              </label>
              <select
                name="engineerId"
                value={formData.engineerId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an engineer</option>
                {ensureArray(data.engineers).map((value) => {
                  const engineer = value as Engineer;
                  return (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.firstName} {engineer.lastName} (@
                      {engineer.username})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Services Used
            </label>
            <input
              type="text"
              name="services"
              value={formData.services}
              onChange={handleChange}
              placeholder="e.g., fremisn, postgre, and v4"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add deployment description, notes, issues, or important information..."
            />
          </div>
        </div>

        {/* Scripts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Deployment Scripts
            </h2>
            <button
              type="button"
              onClick={addScript}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Script
            </button>
          </div>

          {scripts.map((script, index) => (
            <div
              key={index}
              className="mb-4 p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700">
                  Script {index + 1}
                </h3>
                {scripts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScript(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove script"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  value={script.title}
                  onChange={(e) =>
                    handleScriptChange(index, "title", e.target.value)
                  }
                  placeholder="Script title"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <textarea
                  value={script.content}
                  onChange={(e) =>
                    handleScriptChange(index, "content", e.target.value)
                  }
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your script here..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => onNavigate("deployments")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDeployment;
