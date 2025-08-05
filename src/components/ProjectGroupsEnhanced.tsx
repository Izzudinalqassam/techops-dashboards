import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { Plus, Search, Users, Trash2 } from "lucide-react";
import Breadcrumb, { useBreadcrumbs } from "./ui/Breadcrumb";
import ViewToggle, { ViewMode } from "./ui/ViewToggle";
import ProjectGroupCard from "./cards/ProjectGroupCard";
import Button from "./ui/Button";
import QuickCreateModal from "./modals/QuickCreateModal";
import EditProjectGroupModal from "./modals/EditProjectGroupModal";
import { useProjectGroups, useProjects } from "../hooks";
import { ProjectGroup, Project, Deployment } from "../types";
import { useNotification } from "../contexts/NotificationContext";

interface ProjectGroupsEnhancedProps {
  data: {
    projectGroups: ProjectGroup[];
    projects: Project[];
    deployments: Deployment[];
  };
}

const ProjectGroupsEnhanced: React.FC<ProjectGroupsEnhancedProps> = ({
  data,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<
    "project" | "project-group"
  >("project-group");
  const [quickCreateContext, setQuickCreateContext] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(null);

  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const { deleteProjectGroup, fetchProjectGroups } = useProjectGroups();
  const { showSuccess, showError } = useNotification();
  const { shouldShowCreateButton } = usePermissions();

  // Handle navigation to projects filtered by group
  const handleViewProjects = (group: ProjectGroup) => {
    navigate(`/projects?group=${group.id}`);
  };

  // Filter and search logic
  const filteredProjectGroups = useMemo(() => {
    let filtered = data.projectGroups;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data.projectGroups, searchTerm]);

  // Get related data for each project group
  const getProjectGroupData = (projectGroup: ProjectGroup) => {
    // Handle both string and number types for groupId comparison
    const projects = data.projects.filter(
      (p) => String(p.groupId) === String(projectGroup.id)
    );
    const deployments = data.deployments.filter((d) =>
      projects.some((p) => String(p.id) === String(d.projectId))
    );
    return { projects, deployments };
  };

  const handleAddProject = (group: ProjectGroup) => {
    // Open quick create modal with group context pre-filled
    setQuickCreateType("project");
    setQuickCreateContext({
      groupId: group.id,
      groupName: group.name,
    });
    setShowQuickCreate(true);
  };

  const handleEditGroup = (group: ProjectGroup) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const handleDeleteGroup = async (group: ProjectGroup) => {
    try {
      await deleteProjectGroup(group.id);
      showSuccess(`Project group "${group.name}" deleted successfully`);

      // Stay on project groups page after deletion
      // The data will be automatically refreshed by the useProjectGroups hook
    } catch (error: any) {
      console.error("Failed to delete project group:", error);

      // Handle specific error types with user-friendly messages
      let errorMessage = "Failed to delete project group. Please try again.";

      if (error.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.status === 403) {
        errorMessage =
          "Access denied. You don't have permission to delete project groups.";
      } else if (error.status === 404) {
        errorMessage =
          "Project group not found. It may have already been deleted.";
      } else if (error.status === 409) {
        errorMessage =
          "Cannot delete project group that contains projects. Please move or delete the projects first.";
      } else if (error.status === 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (
        error.message &&
        error.message !== "Failed to delete project group"
      ) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    }
  };

  const handleCreateProjectGroup = () => {
    // Open quick create modal for new project group
    setQuickCreateType("project-group");
    setQuickCreateContext(null);
    setShowQuickCreate(true);
  };

  const handleCloseQuickCreate = () => {
    setShowQuickCreate(false);
    setQuickCreateContext(null);
  };

  // Calculate summary statistics
  const totalProjects = data.projects.length;
  const totalDeployments = data.deployments.length;
  const activeGroups = filteredProjectGroups.filter((group) =>
    data.projects.some((p) => p.groupId === group.id)
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Groups</h1>
          <p className="text-gray-600 mt-1">
            {filteredProjectGroups.length}{" "}
            {filteredProjectGroups.length === 1 ? "group" : "groups"}
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {shouldShowCreateButton("project_group") && (
            <Button icon={Plus} onClick={handleCreateProjectGroup}>
              New Project Group
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProjectGroups.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-bold text-gray-900">{activeGroups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalProjects}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search project groups..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* View Toggle */}
        <ViewToggle
          currentView={viewMode}
          onViewChange={setViewMode}
          availableViews={["cards", "table"]}
        />
      </div>

      {/* Content */}
      {filteredProjectGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No project groups found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search"
              : "Get started by creating your first project group"}
          </p>
          <Button icon={Plus} onClick={handleCreateProjectGroup}>
            Create Project Group
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjectGroups.map((group) => {
                const { projects, deployments } = getProjectGroupData(group);
                return (
                  <ProjectGroupCard
                    key={group.id}
                    projectGroup={group}
                    projects={projects}
                    deployments={deployments}
                    onEdit={handleEditGroup}
                    onAddProject={handleAddProject}
                    onDelete={handleDeleteGroup}
                    onViewProjects={handleViewProjects}
                  />
                );
              })}
            </div>
          )}

          {viewMode === "table" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recent Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjectGroups.map((group) => {
                    const { projects, deployments } =
                      getProjectGroupData(group);
                    const recentDeployment = deployments.sort(
                      (a, b) =>
                        new Date(b.deployedAt).getTime() -
                        new Date(a.deployedAt).getTime()
                    )[0];

                    return (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <Link
                              to={`/project-groups/${group.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                            >
                              {group.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {group.description || "No description"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {projects.length}{" "}
                            {projects.length === 1 ? "project" : "projects"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {recentDeployment
                            ? `${new Date(
                                recentDeployment.deployedAt
                              ).toLocaleDateString()}`
                            : "No deployments"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditGroup(group)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddProject(group)}
                            >
                              Add Project
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteGroup(group)}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={handleCloseQuickCreate}
        type={quickCreateType}
        context={quickCreateContext}
      />

      {/* Edit Project Group Modal */}
      {selectedGroup && (
        <EditProjectGroupModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedGroup(null);
          }}
          projectGroup={selectedGroup}
          onProjectGroupUpdated={fetchProjectGroups}
        />
      )}
    </div>
  );
};

export default ProjectGroupsEnhanced;
