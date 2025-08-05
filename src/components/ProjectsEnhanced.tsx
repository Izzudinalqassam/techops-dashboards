import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { Plus, Search, Filter, Grid, Table, Trash2 } from "lucide-react";
import Breadcrumb, { useBreadcrumbs } from "./ui/Breadcrumb";
import ViewToggle, { ViewMode } from "./ui/ViewToggle";
import ProjectCard from "./cards/ProjectCard";
import ProjectStatistics from "./cards/ProjectStatistics";
import Button from "./ui/Button";
import QuickCreateModal, { QuickCreateType } from "./modals/QuickCreateModal";
import EditProjectModal from "./modals/EditProjectModal";
import { useProjects, useProjectGroups } from "../hooks";
import { Project, ProjectGroup, Engineer } from "../types";
import { useNotification } from "../contexts/NotificationContext";
import { ensureArray } from "../utils/arrayValidation";
import useBulkSelection from "../hooks/useBulkSelection";
import BulkActionsToolbar from "./ui/BulkActionsToolbar";
import BulkDeleteConfirmDialog from "./ui/BulkDeleteConfirmDialog";
import { usePagination } from "../hooks/usePagination";
import Pagination from "./common/Pagination";

interface ProjectsEnhancedProps {
  data: {
    projects: Project[];
    projectGroups: ProjectGroup[];
    engineers: Engineer[];
    deployments: any[];
  };
  selectedGroup?: string | null;
  onNavigate?: (view: string, groupId?: string, projectId?: string) => void;
}

const ProjectsEnhanced: React.FC<ProjectsEnhancedProps> = ({
  data,
  selectedGroup,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [localSelectedGroup, setLocalSelectedGroup] = useState<string>("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateContext, setQuickCreateContext] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const [searchParams] = useSearchParams();
  const { deleteProject, fetchProjects } = useProjects();
  const { showSuccess, showError } = useNotification();
  const { shouldShowCreateButton } = usePermissions();

  // Handle URL search params for group filtering
  useEffect(() => {
    const groupParam = searchParams.get("group");

    if (groupParam) {
      // Find group to verify it exists
      const group = data.projectGroups.find((g) => g.id === groupParam);
      if (group) {
        setLocalSelectedGroup(groupParam);
      } else {
        // Group doesn't exist (possibly deleted), clear the URL parameter
        navigate("/projects", { replace: true });
      }
    }
  }, [searchParams, data.projectGroups, navigate]);

  // Handle navigation to deployments filtered by project
  const handleViewDeployments = (project: Project) => {
    navigate(`/deployments?project=${project.id}`);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedEnvironment("");
    setLocalSelectedGroup("");
    // Clear URL params
    navigate("/projects", { replace: true });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || selectedEnvironment || localSelectedGroup || selectedGroup;

  // Filter and search logic
  const filteredProjects = useMemo(() => {
    let filtered = data.projects;

    // Filter by selected group (from prop or URL param)
    const activeGroupFilter = selectedGroup || localSelectedGroup;
    if (activeGroupFilter) {
      filtered = filtered.filter(
        (project) => project.groupId === activeGroupFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by environment
    if (selectedEnvironment) {
      filtered = filtered.filter(
        (project) => project.environment === selectedEnvironment
      );
    }

    return filtered;
  }, [
    data.projects,
    selectedGroup,
    localSelectedGroup,
    searchTerm,
    selectedEnvironment,
  ]);

  // Pagination hook
  const pagination = usePagination(filteredProjects, {
    initialItemsPerPage: 25,
    resetPageOnDataChange: true,
  });

  // Bulk selection hook (use paginated data)
  const bulkSelection = useBulkSelection({
    items: pagination.paginatedData,
    getItemId: (project) => project.id,
  });

  // Get related data for each project
  const getProjectData = (project: Project) => {
    const projectGroup = data.projectGroups.find(
      (g) => g.id === project.groupId
    );
    // Get assigned engineer from project data
    const engineer = project.assignedEngineer;
    const projectDeployments = data.deployments.filter(
      (d) => d.projectId === project.id
    );
    const lastDeployment = projectDeployments.sort(
      (a, b) =>
        new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    )[0];
    const deploymentCount = projectDeployments.length;

    return {
      projectGroup,
      engineer,
      lastDeployment,
      deploymentCount,
      deployments: projectDeployments.sort(
        (a, b) =>
          new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
      ),
    };
  };

  const handleQuickCreate = (groupId?: string, groupName?: string) => {
    setQuickCreateContext({ groupId, groupName });
    setShowQuickCreate(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleDeployProject = (project: Project) => {
    navigate("/add-deployment", {
      state: { projectId: project.id, projectName: project.name },
    });
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project.id);
      showSuccess(`Project "${project.name}" deleted successfully`);

      // If the deleted project was in the currently selected group,
      // check if there are any remaining projects in that group
      if (localSelectedGroup === project.groupId) {
        const remainingProjectsInGroup = data.projects.filter(
          (p) => p.groupId === project.groupId && p.id !== project.id
        );

        // If no projects remain in the group, clear the group filter
        if (remainingProjectsInGroup.length === 0) {
          setLocalSelectedGroup("");
          navigate("/projects", { replace: true });
        }
      }
    } catch (error: any) {
      console.error("Failed to delete project:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Failed to delete project. Please try again.";

      if (error.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.status === 403) {
        errorMessage =
          "Access denied. You don't have permission to delete projects.";
      } else if (error.status === 404) {
        errorMessage = "Project not found. It may have already been deleted.";
      } else if (error.status === 409) {
        errorMessage =
          "Cannot delete project that has deployments. Please delete all deployments first.";
      } else if (error.status === 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (
        error.message &&
        error.message !== "Failed to delete project"
      ) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    }
  };

  // Bulk delete handlers
  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const selectedProjects = bulkSelection.selectedItemsData;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const project of selectedProjects) {
        try {
          await deleteProject(project.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete project ${project.name}:`, error);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        showSuccess(
          `Successfully deleted ${successCount} project${
            successCount > 1 ? "s" : ""
          }`
        );
      }
      if (errorCount > 0) {
        showError(
          `Failed to delete ${errorCount} project${
            errorCount > 1 ? "s" : ""
          }. They may have deployments or other dependencies.`
        );
      }

      // Clear selection and refresh data
      bulkSelection.clearSelection();
      await fetchProjects();
    } catch (error) {
      showError("An error occurred during bulk deletion");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const environments = ["Development", "Staging", "Production"];
  const selectedGroupData = selectedGroup
    ? data.projectGroups.find((g) => g.id === selectedGroup)
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedGroupData
              ? `${selectedGroupData.name} Projects`
              : "Projects"}
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination.totalItems}{" "}
            {pagination.totalItems === 1 ? "project" : "projects"}
            {selectedGroupData && ` in ${selectedGroupData.name}`}
            {pagination.totalPages > 1 && (
              <span className="text-gray-500">
                {" "}
                • Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {shouldShowCreateButton("project") && (
            <Button
              icon={Plus}
              onClick={() =>
                handleQuickCreate(
                  selectedGroup || undefined,
                  selectedGroupData?.name
                )
              }
            >
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Project Statistics */}
      <div className="mb-8">
        <ProjectStatistics data={data} />
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelection.selectedCount}
        totalCount={bulkSelection.totalCount}
        onDelete={handleBulkDelete}
        onClearSelection={bulkSelection.clearSelection}
        isDeleting={isBulkDeleting}
        deleteLabel="Delete Projects"
      />

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Project Group Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localSelectedGroup}
            onChange={(e) => setLocalSelectedGroup(e.target.value)}
          >
            <option value="">All Project Groups</option>
            {data.projectGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          {/* Environment Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
          >
            <option value="">All Environments</option>
            {environments.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* View Toggle */}
        <ViewToggle
          currentView={viewMode}
          onViewChange={setViewMode}
          availableViews={["cards", "table"]}
        />
      </div>

      {/* Content */}
      {pagination.totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grid className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedEnvironment
              ? "Try adjusting your search or filters"
              : "Get started by creating your first project"}
          </p>
          <Button
            icon={Plus}
            onClick={() =>
              handleQuickCreate(
                selectedGroup || undefined,
                selectedGroupData?.name
              )
            }
          >
            Create Project
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagination.paginatedData.map((project) => {
                const {
                  projectGroup,
                  engineer,
                  lastDeployment,
                  deploymentCount,
                  deployments,
                } = getProjectData(project);
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    projectGroup={projectGroup}
                    engineer={engineer}
                    lastDeployment={lastDeployment}
                    deploymentCount={deploymentCount}
                    deployments={deployments}
                    onEdit={handleEditProject}
                    onDeploy={handleDeployProject}
                    onDelete={handleDeleteProject}
                    onViewDeployments={handleViewDeployments}
                    isSelected={bulkSelection.isSelected(project.id)}
                    onToggleSelect={bulkSelection.toggleItem}
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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={bulkSelection.isAllSelected}
                        ref={(input) => {
                          if (input)
                            input.indeterminate = bulkSelection.isIndeterminate;
                        }}
                        onChange={bulkSelection.toggleAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Environment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engineer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Deploy
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagination.paginatedData.map((project) => {
                    const { projectGroup, engineer, lastDeployment } =
                      getProjectData(project);
                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={bulkSelection.isSelected(project.id)}
                            onChange={() =>
                              bulkSelection.toggleItem(project.id)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <Link
                              to={`/projects/${project.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {project.name}
                            </Link>
                            <div className="text-sm text-gray-500">
                              {projectGroup?.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.status === "active"
                                ? "bg-green-100 text-green-800"
                                : project.status === "inactive"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {project.status || "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {engineer?.fullName ||
                            `${engineer?.firstName} ${engineer?.lastName}`.trim() ||
                            engineer?.username ||
                            "Unassigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lastDeployment
                            ? new Date(
                                lastDeployment.deployedAt
                              ).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProject(project)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeployProject(project)}
                            >
                              Deploy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProject(project)}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.goToPage}
            onItemsPerPageChange={pagination.setItemsPerPage}
            showPageSizeSelector={true}
            showPageInfo={true}
          />
        </div>
      )}

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        type="project"
        context={quickCreateContext}
      />

      {/* Edit Project Modal */}
      {selectedProject && (
        <EditProjectModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          projectGroups={data.projectGroups}
          onProjectUpdated={fetchProjects}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleConfirmBulkDelete}
        selectedCount={bulkSelection.selectedCount}
        itemType="project"
        isDeleting={isBulkDeleting}
        warningMessage="Deleting projects will also remove all associated deployments and data. This action cannot be undone."
      />
    </div>
  );
};

export default ProjectsEnhanced;
