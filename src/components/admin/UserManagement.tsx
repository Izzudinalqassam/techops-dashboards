import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  ShieldCheck,
  Key,
  User as UserIcon,
  Clock,
} from "lucide-react";
import { useUsers } from "../../hooks/useUsers";
import { useNotification } from "../../contexts/NotificationContext";
import { usePagination } from "../../hooks/usePagination";
import { User, UserRole } from "../../types";
import Button from "../ui/Button";
import Breadcrumb, { useBreadcrumbs } from "../ui/Breadcrumb";
import Pagination from "../common/Pagination";
import ChangePasswordModal from "./ChangePasswordModal";
import EditUserModal from "./EditUserModal";
import CreateUserModal from "./CreateUserModal";
import ConfirmationModal from "../ui/ConfirmationModal";
import useBulkSelection from "../../hooks/useBulkSelection";
import BulkActionsToolbar from "../ui/BulkActionsToolbar";
import BulkDeleteConfirmDialog from "../ui/BulkDeleteConfirmDialog";
import { formatWIBRelativeTime } from "../../utils/timezone";

// Helper function to format last login timestamp in WIB timezone
const formatLastLogin = (lastLogin?: string): string => {
  return formatWIBRelativeTime(lastLogin);
};

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { users, loading, error, fetchUsers, deleteUser, clearError } =
    useUsers();

  const { showSuccess, showError } = useNotification();
  const breadcrumbs = useBreadcrumbs();

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers().catch(console.error);
  }, []); // Empty dependency array - only run on mount

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (selectedRole) {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    return filtered.sort((a, b) => a.username.localeCompare(b.username));
  }, [users, searchTerm, selectedRole]);

  // Pagination
  const pagination = usePagination(filteredUsers, {
    initialItemsPerPage: 25,
    resetPageOnDataChange: true,
  });

  // Bulk selection hook (use paginated data)
  const bulkSelection = useBulkSelection({
    items: pagination.paginatedData,
    getItemId: (user) => user.id,
  });

  // Handle user deletion with enhanced safety and feedback
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDeleteUser = (user: User) => {
    // Prevent multiple simultaneous delete operations
    if (deletingUserId || loading) {
      console.log("Delete operation already in progress, ignoring request");
      return;
    }

    // Set the selected user and show confirmation modal
    setSelectedUser(user);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setDeletingUserId(selectedUser.id);

    try {
      const result = await deleteUser(selectedUser.id);

      if (result.success) {
        showSuccess(
          `User "${selectedUser.username}" has been deleted successfully.`
        );
      } else {
        showError(result.message);
      }
    } catch (error) {
      // Error is already handled in the hook, but show user-friendly message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete user. Please try again.";
      showError(errorMessage);
      console.error("Delete user error:", error);
    } finally {
      setDeletingUserId(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setSelectedUser(null);
  };

  // Bulk delete handlers
  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const selectedUsers = bulkSelection.selectedItemsData;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of selectedUsers) {
        try {
          await deleteUser(user.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete user ${user.username}:`, error);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        showSuccess(
          `Successfully deleted ${successCount} user${
            successCount > 1 ? "s" : ""
          }`
        );
      }
      if (errorCount > 0) {
        showError(
          `Failed to delete ${errorCount} user${
            errorCount > 1 ? "s" : ""
          }. They may have dependencies or other issues.`
        );
      }

      // Clear selection and refresh data
      bulkSelection.clearSelection();
      await fetchUsers();
    } catch (error) {
      showError("An error occurred during bulk deletion");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle change password
  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRole("");
  };

  const hasActiveFilters = searchTerm || selectedRole;

  // Role badge styling
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "User":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return <ShieldCheck className="w-4 h-4" />;
      case "User":
        return <UserIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            {pagination.totalItems}{" "}
            {pagination.totalItems === 1 ? "user" : "users"}
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Add User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | "")}
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelection.selectedCount}
        totalCount={bulkSelection.totalCount}
        onDelete={handleBulkDelete}
        onClearSelection={bulkSelection.clearSelection}
        isDeleting={isBulkDeleting}
        deleteLabel="Delete Users"
      />

      {/* Users Table */}
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
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagination.paginatedData.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={bulkSelection.isSelected(user.id)}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      bulkSelection.toggleItem(user.id);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username} • {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeStyle(
                      user.role
                    )}`}
                  >
                    {getRoleIcon(user.role)}
                    <span className="ml-1 capitalize">{user.role}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{formatLastLogin(user.lastLogin)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleChangePassword(user)}
                      className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                      title="Change password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                      disabled={deletingUserId === user.id || loading}
                      className={`p-1 rounded transition-colors ${
                        deletingUserId === user.id || loading
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-red-600 hover:text-red-900 hover:bg-red-50"
                      }`}
                      title={
                        deletingUserId === user.id
                          ? "Deleting user..."
                          : "Delete user"
                      }
                    >
                      {deletingUserId === user.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalItems === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? "Try adjusting your search or filters"
                : "Get started by adding your first user"}
            </p>
            {!hasActiveFilters && (
              <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
                Add User
              </Button>
            )}
          </div>
        )}

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

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={fetchUsers}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={fetchUsers}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete user ${selectedUser.username} (${selectedUser.email})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deletingUserId === selectedUser.id}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleConfirmBulkDelete}
        selectedCount={bulkSelection.selectedCount}
        itemType="user"
        isDeleting={isBulkDeleting}
        warningMessage="Deleting users will remove all their data and access. This action cannot be undone."
      />
    </div>
  );
};

export default UserManagement;
