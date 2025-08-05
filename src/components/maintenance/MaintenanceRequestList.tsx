import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Clock,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  Download,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  MaintenanceRequest,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../../types";
import { useMaintenance } from "../../hooks/useMaintenance";
import { useEngineers } from "../../hooks/useEngineers";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { usePagination } from "../../hooks/usePagination";
import {
  formatWIBRelativeTime,
  formatWIBTimestamp,
} from "../../utils/timezone";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import ConfirmationModal from "../ui/ConfirmationModal";
import { TableSkeleton } from "../ui/SkeletonLoader";
import Pagination from "../common/Pagination";
import useBulkSelection from "../../hooks/useBulkSelection";
import BulkActionsToolbar from "../ui/BulkActionsToolbar";
import BulkDeleteConfirmDialog from "../ui/BulkDeleteConfirmDialog";

interface MaintenanceRequestListProps {
  onCreateRequest: () => void;
  onViewRequest: (request: MaintenanceRequest) => void;
  onEditRequest: (request: MaintenanceRequest) => void;
}

type SortField =
  | "createdAt"
  | "priority"
  | "status"
  | "clientName"
  | "requestedDate";
type SortDirection = "asc" | "desc";

const MaintenanceRequestList: React.FC<MaintenanceRequestListProps> = ({
  onCreateRequest,
  onViewRequest,
  onEditRequest,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<
    MaintenancePriority | ""
  >("");
  const [categoryFilter, setCategoryFilter] = useState<
    MaintenanceCategory | ""
  >("");
  const [engineerFilter, setEngineerFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    request: MaintenanceRequest | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    request: null,
    isDeleting: false,
  });

  // State to track deletion in progress to prevent multiple simultaneous deletions
  const [deletingRequestIds, setDeletingRequestIds] = useState<Set<string>>(
    new Set()
  );
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { requests, loading, error, fetchRequests, deleteRequest, clearError } =
    useMaintenance();

  // Handle statistics card clicks for filtering
  const handleStatusFilter = (status: MaintenanceStatus | "") => {
    setStatusFilter(status);
    setPriorityFilter(""); // Clear priority filter when status is selected
  };

  const handlePriorityFilter = (priority: MaintenancePriority | "") => {
    setPriorityFilter(priority);
    setStatusFilter(""); // Clear status filter when priority is selected
  };

  const clearAllFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setEngineerFilter("");
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };
  const { engineers } = useEngineers();
  const { showSuccess, showError } = useNotification();
  const { state } = useAuth();

  // Check if user has admin permissions
  const isAdmin = state.user?.role === "Admin";
  const canModify = isAdmin;
  const canCreate = !!state.user; // All authenticated users can create requests

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data on component mount
  useEffect(() => {
    fetchRequests().catch(console.error);
    // Engineers data is already fetched globally in App.tsx, no need to fetch here
  }, []); // Empty dependency array - only run on mount

  // Engineers are already filtered from the useEngineers hook
  // No need to filter further as the backend returns only active users with admin/user roles

  // Calculate status counts for filter dropdown
  const statusCounts = useMemo(() => {
    const counts: Record<MaintenanceStatus, number> = {
      Pending: 0,
      "In Progress": 0,
      "On Hold": 0,
      Completed: 0,
      Cancelled: 0,
    };

    requests.forEach((request) => {
      counts[request.status] = (counts[request.status] || 0) + 1;
    });

    return counts;
  }, [requests]);

  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    // Apply enhanced search filter with debouncing
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          // Basic fields
          request.clientName.toLowerCase().includes(searchLower) ||
          request.clientEmail.toLowerCase().includes(searchLower) ||
          request.title.toLowerCase().includes(searchLower) ||
          request.description.toLowerCase().includes(searchLower) ||
          request.requestNumber.toLowerCase().includes(searchLower) ||
          request.clientCompany?.toLowerCase().includes(searchLower) ||
          // Enhanced search: priority, category, status
          request.priority.toLowerCase().includes(searchLower) ||
          request.category.toLowerCase().includes(searchLower) ||
          request.status.toLowerCase().includes(searchLower) ||
          // Enhanced search: assigned engineer
          request.assignedEngineer?.firstName
            .toLowerCase()
            .includes(searchLower) ||
          request.assignedEngineer?.lastName
            .toLowerCase()
            .includes(searchLower) ||
          request.assignedEngineer?.username.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(
        (request) => request.priority === priorityFilter
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (request) => request.category === categoryFilter
      );
    }

    // Apply engineer filter
    if (engineerFilter) {
      filtered = filtered.filter(
        (request) => request.assignedEngineerId === engineerFilter
      );
    }

    // Sort requests
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "requestedDate":
          aValue = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
          bValue = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
          break;
        case "priority":
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "clientName":
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    requests,
    debouncedSearchTerm,
    statusFilter,
    priorityFilter,
    categoryFilter,
    engineerFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const pagination = usePagination(filteredAndSortedRequests, {
    initialItemsPerPage: 25,
    resetPageOnDataChange: true,
  });

  // Bulk selection hook (use paginated data)
  const bulkSelection = useBulkSelection({
    items: pagination.paginatedData,
    getItemId: (request) => request.id,
  });

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle delete request - open confirmation modal
  const handleDeleteRequest = (request: MaintenanceRequest) => {
    setDeleteConfirmation({
      isOpen: true,
      request,
      isDeleting: false,
    });
  };

  // Confirm delete request with enhanced error handling
  const confirmDeleteRequest = async () => {
    if (!deleteConfirmation.request || deleteConfirmation.isDeleting) return;

    const requestId = deleteConfirmation.request.id;

    // Check if deletion is already in progress for this request
    if (deletingRequestIds.has(requestId)) {
      console.log(`Deletion already in progress for request ${requestId}`);
      return;
    }

    // Mark deletion as in progress
    setDeletingRequestIds((prev) => new Set(prev).add(requestId));
    setDeleteConfirmation((prev) => ({ ...prev, isDeleting: true }));

    try {
      const result = await deleteRequest(requestId);

      if (result.success) {
        showSuccess(
          `Maintenance request "${deleteConfirmation.request.requestNumber}" has been deleted successfully.`
        );
        setDeleteConfirmation({
          isOpen: false,
          request: null,
          isDeleting: false,
        });
      } else {
        showError(result.message);
        setDeleteConfirmation((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Failed to delete maintenance request. Please try again.");
      setDeleteConfirmation((prev) => ({ ...prev, isDeleting: false }));
    } finally {
      // Remove from in-progress set
      setDeletingRequestIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Cancel delete request
  const cancelDeleteRequest = () => {
    setDeleteConfirmation({
      isOpen: false,
      request: null,
      isDeleting: false,
    });
  };

  // Bulk delete handlers
  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const selectedRequests = bulkSelection.selectedItemsData;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const request of selectedRequests) {
        try {
          const result = await deleteRequest(request.id);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(
            `Failed to delete maintenance request ${request.requestNumber}:`,
            error
          );
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        showSuccess(
          `Successfully deleted ${successCount} maintenance request${
            successCount > 1 ? "s" : ""
          }`
        );
      }
      if (errorCount > 0) {
        showError(
          `Failed to delete ${errorCount} maintenance request${
            errorCount > 1 ? "s" : ""
          }. They may have dependencies or other issues.`
        );
      }

      // Clear selection and refresh data
      bulkSelection.clearSelection();
      await fetchRequests();
    } catch (error) {
      showError("An error occurred during bulk deletion");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredAndSortedRequests.map((request) => ({
        "Request Number": request.requestNumber,
        "Client Name": request.clientName,
        "Client Email": request.clientEmail,
        "Client Phone": request.clientPhone || "",
        "Client Company": request.clientCompany || "",
        Title: request.title,
        Description: request.description,
        Priority: request.priority,
        Category: request.category,
        Status: request.status,
        "Assigned Engineer": request.assignedEngineer
          ? `${request.assignedEngineer.firstName} ${request.assignedEngineer.lastName}`
          : "Unassigned",
        "Requested Date": new Date(request.createdAt).toLocaleDateString(),
        "Completed Day": request.completedDate
          ? new Date(request.completedDate).toLocaleDateString()
          : "",
        "Created By": request.createdBy
          ? `${request.createdBy.firstName} ${request.createdBy.lastName}`
          : "",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Request Number
        { wch: 25 }, // Client Name
        { wch: 30 }, // Client Email
        { wch: 15 }, // Client Phone
        { wch: 25 }, // Client Company
        { wch: 40 }, // Title
        { wch: 50 }, // Description
        { wch: 12 }, // Priority
        { wch: 12 }, // Category
        { wch: 12 }, // Status
        { wch: 20 }, // Assigned Engineer
        { wch: 15 }, // Requested Date
        { wch: 15 }, // Completed Day
        { wch: 20 }, // Created By
      ];
      worksheet["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Requests");

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const filename = `maintenance-requests-${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      showSuccess(
        "Excel file exported successfully",
        `Downloaded as ${filename}`
      );
    } catch (error) {
      console.error("Export error:", error);
      showError("Failed to export Excel file", "Please try again.");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setEngineerFilter("");
  };

  const hasActiveFilters =
    debouncedSearchTerm ||
    statusFilter ||
    priorityFilter ||
    categoryFilter ||
    engineerFilter;

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Maintenance Requests
          </h2>
          <p className="text-gray-600">Manage and track maintenance requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="flex items-center space-x-2"
            disabled={pagination.totalItems === 0}
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </Button>
          {canCreate && (
            <Button
              onClick={onCreateRequest}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by request #, client, title, description, engineer, status, priority..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {
                  [
                    statusFilter,
                    priorityFilter,
                    categoryFilter,
                    engineerFilter,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as MaintenanceStatus | "")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status ({requests.length})</option>
                  <option value="Pending">
                    Pending ({statusCounts.Pending})
                  </option>
                  <option value="In Progress">
                    In Progress ({statusCounts["In Progress"]})
                  </option>
                  <option value="On Hold">
                    On Hold ({statusCounts["On Hold"]})
                  </option>
                  <option value="Completed">
                    Completed ({statusCounts.Completed})
                  </option>
                  <option value="Cancelled">
                    Cancelled ({statusCounts.Cancelled})
                  </option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as MaintenancePriority | ""
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value as MaintenanceCategory | ""
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Engineer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Engineer
                </label>
                <select
                  value={engineerFilter}
                  onChange={(e) => setEngineerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Engineers</option>
                  {engineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.firstName} {engineer.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  size="sm"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics Dashboard Cards */}
      <div className="space-y-6 mb-8">
        {/* Status Statistics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Status Overview
            </h3>
            {(statusFilter || priorityFilter) && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Requests */}
            <button
              onClick={() => clearAllFilters()}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                !statusFilter && !priorityFilter
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </button>

            {/* Completed Requests */}
            <button
              onClick={() => handleStatusFilter("Completed")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                statusFilter === "Completed"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter((r) => r.status === "Completed").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </button>

            {/* Pending Requests */}
            <button
              onClick={() => handleStatusFilter("Pending")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                statusFilter === "Pending"
                  ? "border-yellow-500 bg-yellow-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {requests.filter((r) => r.status === "Pending").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </button>

            {/* In Progress Requests */}
            <button
              onClick={() => handleStatusFilter("In Progress")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                statusFilter === "In Progress"
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {requests.filter((r) => r.status === "In Progress").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Loader className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </button>

            {/* On Hold Requests */}
            <button
              onClick={() => handleStatusFilter("On Hold")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                statusFilter === "On Hold"
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Hold</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {requests.filter((r) => r.status === "On Hold").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Priority Statistics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Priority Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Critical Priority */}
            <button
              onClick={() => handlePriorityFilter("Critical")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                priorityFilter === "Critical"
                  ? "border-red-500 bg-red-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">
                    {requests.filter((r) => r.priority === "Critical").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </button>

            {/* High Priority */}
            <button
              onClick={() => handlePriorityFilter("High")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                priorityFilter === "High"
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {requests.filter((r) => r.priority === "High").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </button>

            {/* Medium Priority */}
            <button
              onClick={() => handlePriorityFilter("Medium")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                priorityFilter === "Medium"
                  ? "border-yellow-500 bg-yellow-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Medium</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {requests.filter((r) => r.priority === "Medium").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </button>

            {/* Low Priority */}
            <button
              onClick={() => handlePriorityFilter("Low")}
              className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 ${
                priorityFilter === "Low"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low</p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter((r) => r.priority === "Low").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {pagination.startIndex + 1}-{pagination.endIndex} of{" "}
        {pagination.totalItems} maintenance requests
        {pagination.totalItems !== requests.length &&
          ` (filtered from ${requests.length} total)`}
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelection.selectedCount}
        totalCount={bulkSelection.totalCount}
        onDelete={handleBulkDelete}
        onClearSelection={bulkSelection.clearSelection}
        isDeleting={isBulkDeleting}
        deleteLabel="Delete Maintenance Requests"
      />

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile-friendly table wrapper */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : pagination.totalItems === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No maintenance requests found
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by creating your first maintenance request."}
              </p>
              {!hasActiveFilters && canCreate && (
                <Button onClick={onCreateRequest}>Create First Request</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Request #</span>
                        {getSortIcon("createdAt")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("clientName")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Client</span>
                        {getSortIcon("clientName")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("priority")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Priority</span>
                        {getSortIcon("priority")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Engineer
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        {getSortIcon("createdAt")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagination.paginatedData.map((request) => {
                    const assignedEngineer = engineers.find(
                      (eng) => eng.id === request.assignedEngineerId
                    );

                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors focus-within:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset"
                        onClick={() => onViewRequest(request)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onViewRequest(request);
                          }
                        }}
                        role="button"
                        aria-label={`View details for maintenance request ${request.requestNumber}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={bulkSelection.isSelected(request.id)}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              bulkSelection.toggleItem(request.id);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.requestNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.clientName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.clientEmail}
                              </div>
                              {request.clientCompany && (
                                <div className="text-xs text-gray-400 flex items-center">
                                  <Building className="w-3 h-3 mr-1" />
                                  {request.clientCompany}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {request.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.priority === "Critical"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : request.priority === "High"
                                ? "bg-orange-100 text-orange-800 border border-orange-200"
                                : request.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : "bg-green-100 text-green-800 border border-green-200"
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {request.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignedEngineer ? (
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm text-gray-900">
                                  {assignedEngineer.firstName}{" "}
                                  {assignedEngineer.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  @{assignedEngineer.username}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {formatWIBRelativeTime(request.createdAt)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatWIBTimestamp(request.createdAt, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewRequest(request);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canModify && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditRequest(request);
                                  }}
                                  className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50 transition-colors"
                                  title="Edit request"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Prevent multiple clicks if deletion is in progress
                                    if (!deletingRequestIds.has(request.id)) {
                                      handleDeleteRequest(request);
                                    }
                                  }}
                                  disabled={deletingRequestIds.has(request.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    deletingRequestIds.has(request.id)
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-red-600 hover:text-red-900 hover:bg-red-50"
                                  }`}
                                  title={
                                    deletingRequestIds.has(request.id)
                                      ? "Deleting..."
                                      : "Delete request"
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalItems > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.goToPage}
              onItemsPerPageChange={pagination.setItemsPerPage}
              className="border-t border-gray-200 pt-6"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDeleteRequest}
        onConfirm={confirmDeleteRequest}
        title="Delete Maintenance Request"
        message={
          deleteConfirmation.request
            ? `Are you sure you want to delete maintenance request "${deleteConfirmation.request.requestNumber}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Request"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteConfirmation.isDeleting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleConfirmBulkDelete}
        selectedCount={bulkSelection.selectedCount}
        itemType="maintenance request"
        isDeleting={isBulkDeleting}
        warningMessage="Deleting maintenance requests will remove all associated work logs, attachments, and history. This action cannot be undone."
      />
    </div>
  );
};

export default MaintenanceRequestList;
