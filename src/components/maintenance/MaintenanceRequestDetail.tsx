import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  Trash2,
  MessageSquare,
} from "lucide-react";
import {
  MaintenanceRequest,
  MaintenanceStatus,
  AttachmentType,
} from "../../types";
import { useMaintenance } from "../../hooks/useMaintenance";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatWIBTimestamp,
  formatWIBRelativeTime,
} from "../../utils/timezone";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";

interface MaintenanceRequestDetailProps {
  request: MaintenanceRequest;
  onBack: () => void;
  onEdit: () => void;
}

const MaintenanceRequestDetail: React.FC<MaintenanceRequestDetailProps> = ({
  request,
  onBack,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<
    "details" | "workLogs" | "attachments" | "history"
  >("details");
  const [newWorkLog, setNewWorkLog] = useState({
    title: "",
    description: "",
    hoursWorked: 0,
  });
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>(request.status);
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingWorkLog, setIsAddingWorkLog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<AttachmentType>("Other");
  const [attachmentDescription, setAttachmentDescription] = useState("");

  const {
    workLogs,
    attachments,
    statusHistory,
    fetchWorkLogs,
    fetchAttachments,
    fetchStatusHistory,
    addWorkLog,
    uploadAttachment,
    deleteAttachment,
    updateRequestStatus,
  } = useMaintenance();

  const { showSuccess, showError } = useNotification();
  const { state } = useAuth();

  // Check if user has admin permissions
  const isAdmin = state.user?.role === "Admin";
  const canModify = isAdmin;

  // Fetch related data when component mounts or request changes
  useEffect(() => {
    if (request.id) {
      fetchWorkLogs(request.id).catch(console.error);
      fetchAttachments(request.id).catch(console.error);
      fetchStatusHistory(request.id).catch(console.error);
    }
  }, [request.id]); // Only depend on request.id, not fetch functions

  // Handle status update
  const handleStatusUpdate = async () => {
    if (newStatus === request.status) {
      showError("Please select a different status to update.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updatedRequest = await updateRequestStatus(
        request.id,
        newStatus,
        statusReason || undefined
      );
      showSuccess(`Status updated to ${newStatus}`);
      setStatusReason("");
      // Update the local request state to reflect the change immediately
      setNewStatus(updatedRequest.status);
    } catch (error) {
      showError("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle work log submission
  const handleAddWorkLog = async () => {
    if (!newWorkLog.description.trim()) {
      showError("Work log description is required.");
      return;
    }

    setIsAddingWorkLog(true);
    try {
      await addWorkLog(request.id, {
        title: newWorkLog.title || undefined,
        description: newWorkLog.description,
        hoursWorked: newWorkLog.hoursWorked || 0,
      });

      setNewWorkLog({ title: "", description: "", hoursWorked: 0 });
      showSuccess("Work log added successfully");
    } catch (error) {
      showError("Failed to add work log. Please try again.");
    } finally {
      setIsAddingWorkLog(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file to upload.");
      return;
    }

    try {
      await uploadAttachment(
        request.id,
        selectedFile,
        attachmentType,
        attachmentDescription || undefined
      );
      setSelectedFile(null);
      setAttachmentDescription("");
      setAttachmentType("Other");
      showSuccess("File uploaded successfully");
    } catch (error) {
      showError("Failed to upload file. Please try again.");
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async (
    attachmentId: string,
    filename: string
  ) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await deleteAttachment(request.id, attachmentId);
      showSuccess("Attachment deleted successfully");
    } catch (error) {
      showError("Failed to delete attachment. Please try again.");
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: MaintenanceStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "On Hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get priority badge style
  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.requestNumber}
            </h1>
            <p className="text-gray-600">{request.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge
            status={request.status}
            className={getStatusBadgeStyle(request.status)}
          />
          {canModify && (
            <Button
              onClick={onEdit}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Request Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Client Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Client Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium">{request.clientName}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span>{request.clientEmail}</span>
              </div>
              {request.clientPhone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{request.clientPhone}</span>
                </div>
              )}
              {request.clientCompany && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{request.clientCompany}</span>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Request Details
            </h3>
            <div className="space-y-2">
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeStyle(
                    request.priority
                  )}`}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {request.priority}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Category: {request.category}
              </div>
              <div className="text-sm text-gray-600">
                Created: {formatWIBTimestamp(request.createdAt)}
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Assignment
            </h3>
            <div className="space-y-2">
              {request.assignedEngineer ? (
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span>
                    {request.assignedEngineer.firstName}{" "}
                    {request.assignedEngineer.lastName}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Unassigned</div>
              )}
              {request.requestedDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span>
                    Requested: {formatWIBTimestamp(request.requestedDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timing */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span>{formatWIBRelativeTime(request.createdAt)}</span>
              </div>
              {request.scheduledDate && (
                <div className="text-sm text-gray-600">
                  Scheduled: {formatWIBTimestamp(request.scheduledDate)}
                </div>
              )}
              {request.completedDate && (
                <div className="text-sm text-gray-600">
                  Completed: {formatWIBTimestamp(request.completedDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Section - Only for admin users */}
      {canModify && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Update Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(e.target.value as MaintenanceStatus)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for status change"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus || newStatus === request.status}
                loading={isUpdatingStatus}
                className="w-full"
              >
                Update Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "details", label: "Details", icon: FileText },
              { id: "workLogs", label: "Work Logs", icon: MessageSquare },
              { id: "attachments", label: "Attachments", icon: Download },
              { id: "history", label: "History", icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Request Description
              </h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            </div>
          )}

          {/* Work Logs Tab */}
          {activeTab === "workLogs" && (
            <div className="space-y-6">
              {/* Add Work Log Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Add Work Log Entry
                </h4>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Title (optional)"
                      value={newWorkLog.title}
                      onChange={(e) =>
                        setNewWorkLog((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Describe the work done..."
                      value={newWorkLog.description}
                      onChange={(e) =>
                        setNewWorkLog((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hours Worked
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newWorkLog.hoursWorked}
                        onChange={(e) =>
                          setNewWorkLog((prev) => ({
                            ...prev,
                            hoursWorked: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1 flex justify-end">
                      <Button
                        onClick={handleAddWorkLog}
                        disabled={
                          isAddingWorkLog || !newWorkLog.description.trim()
                        }
                        loading={isAddingWorkLog}
                        size="sm"
                      >
                        Add Entry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Logs List */}
              <div className="space-y-4">
                {workLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No work logs yet. Add the first entry above.
                  </div>
                ) : (
                  workLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {log.title && (
                            <h5 className="font-medium text-gray-900">
                              {log.title}
                            </h5>
                          )}
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>
                              {log.author.firstName} {log.author.lastName}
                            </span>
                            <span>{formatWIBTimestamp(log.createdAt)}</span>
                            {log.hoursWorked > 0 && (
                              <span>{log.hoursWorked} hours</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {log.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === "attachments" && (
            <div className="space-y-6">
              {/* Upload Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Upload Attachment
                </h4>
                <div className="space-y-3">
                  <div>
                    <input
                      type="file"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={attachmentType}
                        onChange={(e) =>
                          setAttachmentType(e.target.value as AttachmentType)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Document">Document</option>
                        <option value="Image">Image</option>
                        <option value="Before Photo">Before Photo</option>
                        <option value="After Photo">After Photo</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={attachmentDescription}
                        onChange={(e) =>
                          setAttachmentDescription(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile}
                      size="sm"
                    >
                      Upload File
                    </Button>
                  </div>
                </div>
              </div>

              {/* Attachments List */}
              <div className="space-y-4">
                {attachments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No attachments yet. Upload the first file above.
                  </div>
                ) : (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {attachment.originalFilename}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attachment.attachmentType} •{" "}
                            {(attachment.fileSize / 1024).toFixed(1)} KB •
                            Uploaded by {attachment.uploadedBy.firstName}{" "}
                            {attachment.uploadedBy.lastName} •
                            {formatWIBRelativeTime(attachment.createdAt)}
                          </div>
                          {attachment.description && (
                            <div className="text-sm text-gray-600">
                              {attachment.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            window.open(
                              `http://localhost:3001/api/maintenance/${request.id}/attachments/${attachment.id}/download`,
                              "_blank"
                            )
                          }
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteAttachment(
                              attachment.id,
                              attachment.originalFilename
                            )
                          }
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {statusHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No status history available.
                </div>
              ) : (
                statusHistory.map((history) => (
                  <div
                    key={history.id}
                    className="flex items-start space-x-3 border-l-2 border-gray-200 pl-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {history.oldStatus && (
                          <StatusBadge
                            status={history.oldStatus}
                            className={getStatusBadgeStyle(history.oldStatus)}
                          />
                        )}
                        <span className="text-gray-400">→</span>
                        <StatusBadge
                          status={history.newStatus}
                          className={getStatusBadgeStyle(history.newStatus)}
                        />
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {history.changedBy && (
                          <span>
                            Changed by {history.changedBy.firstName}{" "}
                            {history.changedBy.lastName} •{" "}
                          </span>
                        )}
                        {formatWIBTimestamp(history.createdAt)}
                      </div>
                      {history.changeReason && (
                        <div className="text-sm text-gray-600 mt-1">
                          {history.changeReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceRequestDetail;
