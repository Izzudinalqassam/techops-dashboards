import React, { useState } from "react";
import { Save, ArrowLeft, Rocket, Plus, X, Code } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import { useDeployments } from "../hooks/useDeployments";
import { API_CONFIG } from "../config/api";
import { ensureArray } from "../utils/arrayValidation";
// Timezone utilities removed - backend will auto-populate timestamps

interface AddDeploymentProps {
  data: any;
  onNavigate: (view: string) => void;
}

const AddDeployment: React.FC<AddDeploymentProps> = ({ data, onNavigate }) => {
  const { createDeployment } = useDeployments();
  const { showSuccess, showError } = useNotification();
  // Deployment date/time removed - backend will auto-populate deployed_at timestamp

  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    status: "pending",
    engineerId: "",
    description: "",
    services: "",
  });

  const [scripts, setScripts] = useState([{ title: "", content: "" }]);

  const API_BASE = API_CONFIG.BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data to send to backend - deployedAt will be auto-populated by backend
      const deploymentData = {
        name: formData.name,
        projectId: formData.projectId,
        status: formData.status as
          | "pending"
          | "running"
          | "completed"
          | "failed",
        // deployedAt removed - backend will auto-populate with current timestamp
        engineerId: formData.engineerId,
        description: formData.description || "",
        scripts: scripts.filter((sc) => sc.title || sc.content), // only send scripts with content
        services: formData.services,
      };

      // Use the hook to create deployment - this will update the global state
      await createDeployment(deploymentData);

      // Show success notification
      showSuccess("Deployment created successfully!");

      // Navigate back to deployments page
      onNavigate("deployments");
    } catch (err) {
      console.error("Failed to create deployment:", err);
      showError(
        "Failed to create deployment. Please ensure the backend is running and data is valid."
      );
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
          <div className="p-3 bg-green-50 rounded-lg mr-4">
            <Rocket className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Deployment
            </h1>
            <p className="text-gray-600">
              Record a new deployment with scripts and services
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
        </div>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Deployment Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter deployment name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="projectId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project *
              </label>
              <select
                id="projectId"
                name="projectId"
                required
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {data.projects.map((project: any) => {
                  const group = data.projectGroups.find(
                    (g: any) => g.id === project.groupId
                  );
                  return (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {group?.name ? ` - ${group.name}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Deployment Date & Time removed - backend will auto-populate */}

            <div>
              <label
                htmlFor="engineerId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Assigned Engineer *
              </label>
              <select
                id="engineerId"
                name="engineerId"
                required
                value={formData.engineerId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an engineer</option>
                {ensureArray(data.engineers).map((engineer: any) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.firstName} {engineer.lastName} (@
                    {engineer.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="services"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Services Used
              </label>
              <input
                type="text"
                id="services"
                name="services"
                value={formData.services}
                onChange={handleChange}
                placeholder="e.g., fremisn, postgre, and v4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                List the services used in this deployment, separated by commas
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add deployment description, notes, issues, or important information..."
            />
          </div>
        </div>

        {/* Scripts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Scripts
            </h2>
            <button
              type="button"
              onClick={addScript}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Script
            </button>
          </div>

          <div className="space-y-4">
            {scripts.map((script, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    Script {index + 1}
                  </h3>
                  {scripts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScript(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Script Title
                    </label>
                    <input
                      type="text"
                      value={script.title}
                      onChange={(e) =>
                        handleScriptChange(index, "title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Docker deployment script"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Script Content
                    </label>
                    <textarea
                      rows={8}
                      value={script.content}
                      onChange={(e) =>
                        handleScriptChange(index, "content", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="#!/bin/bash
docker build -t app:latest .
docker run -d -p 3000:3000 app:latest"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex space-x-3">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            Create Deployment
          </button>
          <button
            type="button"
            onClick={() => onNavigate("deployments")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDeployment;
