import React, { useState, useEffect } from "react";
import { X, Edit, Calendar, User, AlertTriangle } from "lucide-react";
import {
  MaintenanceRequest,
  MaintenancePriority,
  MaintenanceCategory,
  User as UserType,
} from "../../types";
import { useMaintenance } from "../../hooks/useMaintenance";
import { useEngineers } from "../../hooks/useEngineers";
import { useNotification } from "../../contexts/NotificationContext";
import { getCurrentWIBTime } from "../../utils/timezone";
import Button from "../ui/Button";

interface EditMaintenanceRequestModalProps {
  request: MaintenanceRequest;
  isOpen: boolean;
  onClose: () => void;
}

const EditMaintenanceRequestModal: React.FC<
  EditMaintenanceRequestModalProps
> = ({ request, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    title: "",
    description: "",
    priority: "Medium" as MaintenancePriority,
    category: "General" as MaintenanceCategory,
    requestedDate: "",
    assignedEngineerId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { updateRequest } = useMaintenance();
  const { engineers, fetchEngineers } = useEngineers();
  const { showSuccess, showError } = useNotification();

  // Helper function to format WIB time for datetime-local input
  const formatWIBForInput = () => {
    const wibTime = getCurrentWIBTime();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    return wibTime.toISOString().slice(0, 16);
  };

  // Initialize form data when request changes
  useEffect(() => {
    if (request) {
      setFormData({
        clientName: request.clientName,
        clientEmail: request.clientEmail,
        clientPhone: request.clientPhone || "",
        clientCompany: request.clientCompany || "",
        title: request.title,
        description: request.description,
        priority: request.priority,
        category: request.category,
        requestedDate: request.requestedDate
          ? new Date(request.requestedDate).toISOString().slice(0, 16)
          : formatWIBForInput(), // Auto-populate with current WIB time if empty
        assignedEngineerId: request.assignedEngineerId || "",
      });
    }
  }, [request]);

  // Engineers data is already fetched globally in App.tsx, no need to fetch here
  // useEffect removed to prevent infinite loops

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = "Client email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = "Please enter a valid email address";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Request title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.requestedDate) {
      const requestedDate = new Date(formData.requestedDate);
      const now = new Date();
      if (requestedDate < now) {
        newErrors.requestedDate = "Requested date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRequest(request.id, {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone || undefined,
        clientCompany: formData.clientCompany || undefined,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        requestedDate: formData.requestedDate || undefined,
        assignedEngineerId: formData.assignedEngineerId || undefined,
      });

      showSuccess("Maintenance request updated successfully");
      handleClose();
    } catch (error) {
      showError("Failed to update maintenance request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle close
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // Get priority badge style
  const getPriorityStyle = (priority: MaintenancePriority) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Maintenance Request
              </h3>
              <p className="text-sm text-gray-500">
                {request.requestNumber} - Update request details
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Information Section */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Client Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Name */}
              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Name *
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.clientName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter client name"
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientName}
                  </p>
                )}
              </div>

              {/* Client Email */}
              <div>
                <label
                  htmlFor="clientEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Email *
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.clientEmail ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter client email"
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientEmail}
                  </p>
                )}
              </div>

              {/* Client Phone */}
              <div>
                <label
                  htmlFor="clientPhone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Phone
                </label>
                <input
                  type="tel"
                  id="clientPhone"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client phone"
                />
              </div>

              {/* Client Company */}
              <div>
                <label
                  htmlFor="clientCompany"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Company
                </label>
                <input
                  type="text"
                  id="clientCompany"
                  name="clientCompany"
                  value={formData.clientCompany}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client company"
                />
              </div>
            </div>
          </div>

          {/* Request Details Section */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Request Details
            </h4>

            {/* Title */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Request Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Brief description of the maintenance request"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Detailed description of the issue or maintenance needed"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityStyle(
                      formData.priority
                    )}`}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {formData.priority}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scheduling & Assignment Section */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Scheduling & Assignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requested Date */}
              <div>
                <label
                  htmlFor="requestedDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Requested Date
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="requestedDate"
                    name="requestedDate"
                    value={formData.requestedDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.requestedDate
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.requestedDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.requestedDate}
                  </p>
                )}
              </div>

              {/* Assigned Engineer */}
              <div>
                <label
                  htmlFor="assignedEngineerId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Assign Engineer
                </label>
                <div className="relative">
                  <select
                    id="assignedEngineerId"
                    name="assignedEngineerId"
                    value={formData.assignedEngineerId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Engineer (Optional)</option>
                    {engineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.firstName} {engineer.lastName} (@
                        {engineer.username})
                      </option>
                    ))}
                  </select>
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaintenanceRequestModal;
