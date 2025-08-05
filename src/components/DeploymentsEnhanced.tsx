import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { Plus, Search, Rocket, Trash2 } from "lucide-react";
import Breadcrumb, { useBreadcrumbs } from "./ui/Breadcrumb";
import ViewToggle, { ViewMode } from "./ui/ViewToggle";
import DeploymentCard from "./cards/DeploymentCard";
import Button from "./ui/Button";
import QuickCreateModal from "./modals/QuickCreateModal";
import StatusBadge from "./ui/StatusBadge";
import InlineStatusEditor from "./ui/InlineStatusEditor";
import { useDeployments } from "../hooks";
import { Deployment, Project, Engineer } from "../types";
import { useNotification } from "../contexts/NotificationContext";
import { ensureArray } from "../utils/arrayValidation";
import useBulkSelection from "../hooks/useBulkSelection";
import BulkActionsToolbar from "./ui/BulkActionsToolbar";
import BulkDeleteConfirmDialog from "./ui/BulkDeleteConfirmDialog";
import { usePagination } from "../hooks/usePagination";
import Pagination from "./common/Pagination";

interface DeploymentsEnhancedProps {
  data: {
    deployments: Deployment[];
    projects: Project[];
    engineers: Engineer[];
  };
  selectedProject?: string | null;
  onNavigate?: (view: string, groupId?: string, projectId?: string) => void;
}

const DeploymentsEnhanced: React.FC<DeploymentsEnhancedProps> = ({
  data,
  selectedProject,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [localSelectedProject, setLocalSelectedProject] = useState<string>("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateContext, setQuickCreateContext] = useState<any>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const [searchParams] = useSearchParams();
  const { shouldShowCreateButton } = usePermissions();

  // Get deployments hook data first
  const {
    deleteDeployment,
    updateDeployment,
    deployments: contextDeployments,
    fetchDeployments,
  } = useDeployments();
  const { showSuccess, showError } = useNotification();

  // Always use context deployments for real-time updates
  // The context deployments should be the source of truth
  const deployments = contextDeployments;

  // Handle URL search params for filtering
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const projectParam = searchParams.get("project");

    if (statusParam) {
      setSelectedStatus(statusParam);
    }

    if (projectParam) {
      // Find project name for display
      const project = data.projects.find((p) => p.id === projectParam);
      if (project) {
        // Set the selected project for filtering
        setLocalSelectedProject(projectParam);
      }
    }
  }, [searchParams, data.projects]);

  // Deployments data is already fetched globally in App.tsx, no need to fetch here
  // useEffect removed to prevent infinite loops

  // Debug logging to track deployment updates (disabled for production)
  // useEffect(() => {
  //   if (process.env.NODE_ENV === "development") {
  //     console.log("DeploymentsEnhanced - deployments updated:", {
  //       contextDeploymentsCount: deployments.length,
  //       propDeploymentsCount: data.deployments.length,
  //       timestamp: new Date().toISOString(),
  //     });
  //   }
  // }, [deployments, data.deployments]);

  // Handle status update
  const handleStatusUpdate = async (
    deploymentId: string,
    newStatus: Deployment["status"]
  ) => {
    try {
      // Find the current deployment to get all required fields
      const currentDeployment = deployments.find((d) => d.id === deploymentId);
      if (!currentDeployment) {
        throw new Error("Deployment not found");
      }

      // Update with all required fields, only changing the status
      const updatedDeployment = await updateDeployment(deploymentId, {
        name: currentDeployment.name,
        projectId: currentDeployment.projectId,
        status: newStatus,
        deployedAt: currentDeployment.deployedAt,
        engineerId: currentDeployment.engineerId,
        description: currentDeployment.description,
        services: currentDeployment.services,
      });

      // Force a refresh of deployments to ensure UI updates
      await fetchDeployments();

      showSuccess(`Deployment status updated to ${newStatus}`);

      // Debug logging (disabled for production)
      // if (process.env.NODE_ENV === "development") {
      //   console.log("Status update completed:", {
      //     deploymentId,
      //     oldStatus: currentDeployment.status,
      //     newStatus,
      //     updatedDeployment,
      //     timestamp: new Date().toISOString(),
      //   });
      // }
    } catch (error) {
      showError("Failed to update deployment status");
      throw error; // Re-throw to let the component handle the error
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setLocalSelectedProject("");
    // Clear URL params
    navigate("/deployments", { replace: true });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || selectedStatus || localSelectedProject || selectedProject;

  // Filter and search logic
  const filteredDeployments = useMemo(() => {
    let filtered = deployments;

    // Filter by selected project (from prop or URL param)
    const activeProjectFilter = selectedProject || localSelectedProject;
    if (activeProjectFilter) {
      filtered = filtered.filter(
        (deployment) => deployment.projectId === activeProjectFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((deployment) => {
        // Get related data for search
        const project = data.projects.find(
          (p) => p.id === deployment.projectId
        );
        const engineer = ensureArray<Engineer>(data.engineers).find(
          (e) => e.id === deployment.engineerId
        );

        return (
          // Search by deployment name
          deployment.name?.toLowerCase().includes(searchLower) ||
          // Search by deployment description
          deployment.description?.toLowerCase().includes(searchLower) ||
          // Search by deployment ID
          deployment.id?.toString().toLowerCase().includes(searchLower) ||
          // Search by project name
          project?.name?.toLowerCase().includes(searchLower) ||
          // Search by engineer name - Fixed property access
          engineer?.fullName?.toLowerCase().includes(searchLower) ||
          engineer?.firstName?.toLowerCase().includes(searchLower) ||
          engineer?.lastName?.toLowerCase().includes(searchLower) ||
          engineer?.username?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(
        (deployment) => deployment.status === selectedStatus
      );
    }

    // Sort by deployment date (newest first)
    return filtered.sort(
      (a, b) =>
        new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    );
  }, [
    deployments,
    selectedProject,
    localSelectedProject,
    searchTerm,
    selectedStatus,
    data.projects,
    data.engineers || [],
  ]);

  // Pagination hook
  const pagination = usePagination(filteredDeployments, {
    initialItemsPerPage: 25,
    resetPageOnDataChange: true,
  });

  // Bulk selection hook (use paginated data)
  const bulkSelection = useBulkSelection({
    items: pagination.paginatedData,
    getItemId: (deployment) => deployment.id,
  });

  // Get related data for each deployment
  const getDeploymentData = (
    deployment: Deployment
  ): { project: Project | undefined; engineer: Engineer | undefined } => {
    // Use project name from deployment if available, otherwise find from projects array
    const project = deployment.projectName
      ? ({
          ...data.projects.find((p) => p.id === deployment.projectId),
          name: deployment.projectName,
        } as Project)
      : data.projects.find((p) => p.id === deployment.projectId);

    // Use engineer data from deployment if available, otherwise find from engineers array
    const engineer = deployment.engineer
      ? ({
          id: deployment.engineer.id,
          username: "", // Not provided in deployment engineer data
          email: deployment.engineer.email,
          firstName: deployment.engineer.firstName,
          lastName: deployment.engineer.lastName,
          role: "", // Not provided in deployment engineer data
          createdAt: "", // Not provided in deployment engineer data
          updatedAt: "", // Not provided in deployment engineer data
          fullName: deployment.engineer.fullName,
          initials: `${deployment.engineer.firstName[0]}${deployment.engineer.lastName[0]}`,
        } as Engineer)
      : ensureArray<Engineer>(data.engineers).find(
          (e) => e.id === deployment.engineerId
        );

    return { project, engineer };
  };

  const handleQuickCreate = (projectId?: string, projectName?: string) => {
    setQuickCreateContext({ projectId, projectName });
    setShowQuickCreate(true);
  };

  const handleEditDeployment = (deployment: Deployment) => {
    navigate(`/deployments/edit/${deployment.id}`);
  };

  const handleViewDeployment = (deployment: Deployment) => {
    navigate(`/deployments/${deployment.id}`);
  };

  const handleDeleteDeployment = async (deployment: Deployment) => {
    try {
      await deleteDeployment(deployment.id);
      const deploymentName =
        deployment.name || `Deployment #${String(deployment.id).slice(-6)}`;
      showSuccess(`Deployment "${deploymentName}" deleted successfully`);
    } catch (error: any) {
      console.error("Failed to delete deployment:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Failed to delete deployment. Please try again.";

      if (error.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.status === 403) {
        errorMessage =
          "Access denied. You don't have permission to delete deployments.";
      } else if (error.status === 404) {
        errorMessage =
          "Deployment not found. It may have already been deleted.";
      } else if (error.status === 409) {
        errorMessage =
          "Cannot delete deployment due to dependencies. Please check related resources.";
      } else if (error.status === 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (
        error.message &&
        error.message !== "Failed to delete deployment"
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
    const selectedDeployments = bulkSelection.selectedItemsData;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const deployment of selectedDeployments) {
        try {
          await deleteDeployment(deployment.id);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to delete deployment ${deployment.name}:`,
            error
          );
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        showSuccess(
          `Successfully deleted ${successCount} deployment${
            successCount > 1 ? "s" : ""
          }`
        );
      }
      if (errorCount > 0) {
        showError(
          `Failed to delete ${errorCount} deployment${
            errorCount > 1 ? "s" : ""
          }. They may have dependencies or other issues.`
        );
      }

      // Clear selection and refresh data
      bulkSelection.clearSelection();
      await fetchDeployments();
    } catch (error) {
      showError("An error occurred during bulk deletion");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const statuses = ["pending", "running", "completed", "failed"];
  const statusDisplayNames = {
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  };
  const selectedProjectData = selectedProject
    ? data.projects.find((p) => p.id === selectedProject)
    : null;

  // Get status counts for summary (use all filtered data, not just current page)
  const statusCounts = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = filteredDeployments.filter(
        (d) => d.status === status
      ).length;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredDeployments]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedProjectData
              ? `${selectedProjectData.name} Deployments`
              : "Deployments"}
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination.totalItems}{" "}
            {pagination.totalItems === 1 ? "deployment" : "deployments"}
            {selectedProjectData && ` for ${selectedProjectData.name}`}
            {pagination.totalPages > 1 && (
              <span className="text-gray-500">
                {" "}
                • Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {shouldShowCreateButton("deployment") && (
            <Button
              icon={Plus}
              onClick={() =>
                handleQuickCreate(
                  selectedProject || undefined,
                  selectedProjectData?.name
                )
              }
            >
              New Deployment
            </Button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statuses.map((status) => (
          <div
            key={status}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {
                    statusDisplayNames[
                      status as keyof typeof statusDisplayNames
                    ]
                  }
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusCounts[status]}
                </p>
              </div>
              <StatusBadge
                status={
                  statusDisplayNames[
                    status as keyof typeof statusDisplayNames
                  ] as any
                }
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelection.selectedCount}
        totalCount={bulkSelection.totalCount}
        onDelete={handleBulkDelete}
        onClearSelection={bulkSelection.clearSelection}
        isDeleting={isBulkDeleting}
        deleteLabel="Delete Deployments"
      />

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search deployments..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Project Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localSelectedProject}
            onChange={(e) => setLocalSelectedProject(e.target.value)}
          >
            <option value="">All Projects</option>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusDisplayNames[status as keyof typeof statusDisplayNames]}
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
            <Rocket className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No deployments found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedStatus
              ? "Try adjusting your search or filters"
              : "Get started by creating your first deployment"}
          </p>
          <Button
            icon={Plus}
            onClick={() =>
              handleQuickCreate(
                selectedProject || undefined,
                selectedProjectData?.name
              )
            }
          >
            Create Deployment
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagination.paginatedData.map((deployment) => {
                const { project, engineer } = getDeploymentData(deployment);
                return (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    project={project}
                    engineer={engineer}
                    onEdit={handleEditDeployment}
                    onView={handleViewDeployment}
                    onDelete={handleDeleteDeployment}
                    onStatusUpdate={handleStatusUpdate}
                    isSelected={bulkSelection.isSelected(deployment.id)}
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
                      Deployment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engineer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deployed At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagination.paginatedData.map((deployment) => {
                    const { project, engineer } = getDeploymentData(deployment);
                    return (
                      <tr key={deployment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={bulkSelection.isSelected(deployment.id)}
                            onChange={() =>
                              bulkSelection.toggleItem(deployment.id)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <Link
                              to={`/deployments/${deployment.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-purple-600"
                            >
                              {deployment.name ||
                                `#${String(deployment.id).slice(-6)}`}
                            </Link>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {deployment.description || "No description"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project?.name || "Unknown Project"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <InlineStatusEditor
                            key={`${deployment.id}-${deployment.status}`}
                            deployment={deployment}
                            onStatusUpdate={handleStatusUpdate}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {engineer?.fullName ||
                            (engineer?.firstName && engineer?.lastName
                              ? `${engineer.firstName} ${engineer.lastName}`
                              : engineer?.username) ||
                            "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(deployment.deployedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDeployment(deployment)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditDeployment(deployment)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDeployment(deployment)}
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
        type="deployment"
        context={quickCreateContext}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleConfirmBulkDelete}
        selectedCount={bulkSelection.selectedCount}
        itemType="deployment"
        isDeleting={isBulkDeleting}
        warningMessage="Deleting deployments will remove all deployment history and data. This action cannot be undone."
      />
    </div>
  );
};

export default DeploymentsEnhanced;
