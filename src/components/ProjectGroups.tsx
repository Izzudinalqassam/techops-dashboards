import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FolderTree,
  Plus,
  Calendar,
  Server,
  Rocket,
  Edit2,
  Trash2,
} from "lucide-react";
import { API_CONFIG } from "../config/api";

interface ProjectGroupsProps {
  data: any;
}

const API_BASE = API_CONFIG.BASE_URL;

const ProjectGroups: React.FC<ProjectGroupsProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project group? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/project-groups/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete project group");
      }

      // Stay on project groups page - the component will re-render with updated data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to delete project group");
    } finally {
      setLoading(false);
    }
  };

  const groupsWithStats = data.projectGroups.map((group: any) => {
    const groupProjects = data.projects.filter(
      (p: any) => p.groupId === group.id
    );
    const groupDeployments = data.deployments.filter((d: any) => {
      const project = data.projects.find((p: any) => p.id === d.projectId);
      return project?.groupId === group.id;
    });

    return {
      ...group,
      projectCount: groupProjects.length,
      deploymentCount: groupDeployments.length,
      projects: groupProjects,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Groups</h1>
          <p className="text-gray-600 mt-1">
            Organize projects by team, client, or work type
          </p>
        </div>
        <Link
          to="/project-groups/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupsWithStats.map((group: any) => (
          <div
            key={group.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FolderTree className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Link
                    to={`/project-groups/${group.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit group"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(group.id);
                    }}
                    className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {group.description && (
                <p className="text-gray-600 mb-4">{group.description}</p>
              )}

              <div className="flex justify-between text-sm mt-4">
                <div className="flex items-center text-gray-500">
                  <Server className="h-4 w-4 mr-1" />
                  {group.projectCount}{" "}
                  {group.projectCount === 1 ? "Project" : "Projects"}
                </div>
                <div className="flex items-center text-gray-500">
                  <Rocket className="h-4 w-4 mr-1" />
                  {group.deploymentCount}{" "}
                  {group.deploymentCount === 1 ? "Deployment" : "Deployments"}
                </div>
              </div>
            </div>

            {group.projects.length > 0 && (
              <div className="border-t border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Recent Projects:
                </p>
                <div className="space-y-1">
                  {group.projects.slice(0, 3).map((project: any) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{project.name}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
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
                  ))}
                  {group.projects.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{group.projects.length - 3} more projects
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 p-4">
              <Link
                to={`/projects?group=${group.id}`}
                className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Projects →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectGroups;
