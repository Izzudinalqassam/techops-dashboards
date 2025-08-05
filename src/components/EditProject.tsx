import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Server } from "lucide-react";
import { API_CONFIG } from '../config/api';
import { ensureArray } from "../utils/arrayValidation";

interface EditProjectProps {
  data: any;
  projectId: string;
  onNavigate: (view: string, groupId?: string, projectId?: string) => void;
}

const EditProject: React.FC<EditProjectProps> = ({
  data,
  projectId,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    environment: "Development",
    engineerId: "",
    groupId: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = API_CONFIG.BASE_URL;

  useEffect(() => {
    // Load project data when component mounts
    const loadProject = async () => {
      try {
        const project = data.projects.find((p: any) => p.id === projectId);
        if (project) {
          setFormData({
            name: project.name,
            environment: project.environment,
            engineerId: project.engineerId,
            groupId: project.groupId,
          });
        }
      } catch (err) {
        console.error("Error loading project:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, data.projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Submitting form data:", { id: projectId, ...formData });
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          environment: formData.environment,
          engineerId: formData.engineerId,
          groupId: formData.groupId,
        }),
      });

      const responseData = await res.json();
      console.log("API Response:", responseData);

      if (!res.ok) {
        throw new Error(responseData.error || "Gagal mengupdate project");
      }

      // After successful update, redirect to the dashboard with success notification
      window.location.href = "/?success=project-updated";
    } catch (err: any) {
      console.error("Error updating project:", err);
      alert(
        `Error: ${
          err.message ||
          "Gagal mengupdate project. Pastikan backend sudah berjalan dan data valid."
        }`
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => onNavigate("projects")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
        <div className="flex items-center mb-2">
          <div className="p-3 bg-blue-50 rounded-lg mr-4">
            <Server className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600">Update project details</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project name"
          />
        </div>

        <div>
          <label
            htmlFor="environment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Environment *
          </label>
          <select
            id="environment"
            name="environment"
            required
            value={formData.environment}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Development">Development</option>
            <option value="Staging">Staging</option>
            <option value="Production">Production</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="groupId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project Group *
          </label>
          <select
            id="groupId"
            name="groupId"
            required
            value={formData.groupId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a project group</option>
            {data.projectGroups.map((group: any) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

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
                {engineer.fullName ||
                  `${engineer.firstName} ${engineer.lastName}`.trim() ||
                  engineer.username}{" "}
                ({engineer.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3 pt-6">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Update Project
          </button>
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
