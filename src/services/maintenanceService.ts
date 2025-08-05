import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { 
  MaintenanceRequest, 
  MaintenanceWorkLog, 
  MaintenanceAttachment, 
  MaintenanceStatusHistory,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceStatus,
  AttachmentType
} from '../types';

export interface CreateMaintenanceRequestData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  requestedDate?: string;
  assignedEngineerId?: string;
}

export interface UpdateMaintenanceRequestData {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  requestedDate?: string;
  scheduledDate?: string;
  assignedEngineerId?: string;
  status?: MaintenanceStatus;
}

export interface CreateWorkLogData {
  entryType?: string;
  title?: string;
  description: string;
  hoursWorked?: number;
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  assignedEngineerId?: string;
  clientEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  criticalRequests: number;
  highPriorityRequests: number;
  requestsByCategory: Record<MaintenanceCategory, number>;
  requestsByStatus: Record<MaintenanceStatus, number>;
}

class MaintenanceService {
  private baseUrl = API_ENDPOINTS.MAINTENANCE;

  // Convert database row to MaintenanceRequest object
  private mapRowToMaintenanceRequest(row: any): MaintenanceRequest {
    return {
      id: row.id.toString(),
      requestNumber: row.requestNumber || row.request_number,
      clientName: row.clientName || row.client_name,
      clientEmail: row.clientEmail || row.client_email,
      clientPhone: row.clientPhone || row.client_phone,
      clientCompany: row.clientCompany || row.client_company,
      title: row.title,
      description: row.description,
      priority: row.priority,
      category: row.category,
      requestedDate: row.requestedDate || row.requested_date,
      scheduledDate: row.scheduledDate || row.scheduled_date,
      completedDate: row.completedDate || row.completed_date,
      assignedEngineerId: row.assignedEngineerId || row.assigned_engineer_id,
      assignedEngineer: row.assignedEngineer || row.assigned_engineer,
      createdById: row.createdById || row.created_by_id,
      createdBy: row.createdBy || row.created_by,
      status: row.status,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
      attachments: row.attachments,
      workLogs: row.workLogs || row.work_logs,
      statusHistory: row.statusHistory || row.status_history
    };
  }

  // Get all maintenance requests with optional filtering
  async getMaintenanceRequests(filters?: MaintenanceFilters): Promise<MaintenanceRequest[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await apiService.get<{maintenanceRequests: any[], pagination: any, filters: any, sorting: any}>(url);
      
      // Backend returns {maintenanceRequests: [...], pagination: {...}, ...}
      // Extract the maintenanceRequests array from the response
      return response.maintenanceRequests.map(row => this.mapRowToMaintenanceRequest(row));
    } catch (error) {
      console.error('MaintenanceService.getMaintenanceRequests error:', error);
      throw new Error('Failed to fetch maintenance requests');
    }
  }

  // Get maintenance request by ID
  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
    try {
      const response = await apiService.get<any>(`${this.baseUrl}/${id}`);
      return this.mapRowToMaintenanceRequest(response);
    } catch (error) {
      console.error('MaintenanceService.getMaintenanceRequestById error:', error);
      throw new Error('Failed to fetch maintenance request');
    }
  }

  // Create new maintenance request
  async createMaintenanceRequest(data: CreateMaintenanceRequestData): Promise<MaintenanceRequest> {
    try {
      // Transform frontend data to match database schema
      const dbData = {
        client_name: data.clientName,
        client_email: data.clientEmail,
        client_phone: data.clientPhone,
        client_company: data.clientCompany,
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        // requested_date removed - backend will auto-populate created_at
        assigned_engineer_id: data.assignedEngineerId
      };

      const response = await apiService.post<{message: string, maintenanceRequest: any}>(this.baseUrl, dbData);
      return this.mapRowToMaintenanceRequest(response.maintenanceRequest);
    } catch (error) {
      console.error('MaintenanceService.createMaintenanceRequest error:', error);
      throw new Error('Failed to create maintenance request');
    }
  }

  // Update maintenance request
  async updateMaintenanceRequest(id: string, data: UpdateMaintenanceRequestData): Promise<MaintenanceRequest> {
    try {
      // Transform frontend data to match database schema
      const dbData: any = {};
      
      if (data.clientName !== undefined) dbData.client_name = data.clientName;
      if (data.clientEmail !== undefined) dbData.client_email = data.clientEmail;
      if (data.clientPhone !== undefined) dbData.client_phone = data.clientPhone;
      if (data.clientCompany !== undefined) dbData.client_company = data.clientCompany;
      if (data.title !== undefined) dbData.title = data.title;
      if (data.description !== undefined) dbData.description = data.description;
      if (data.priority !== undefined) dbData.priority = data.priority;
      if (data.category !== undefined) dbData.category = data.category;
      if (data.requestedDate !== undefined) dbData.requested_date = data.requestedDate;
      if (data.scheduledDate !== undefined) dbData.scheduled_date = data.scheduledDate;
      if (data.assignedEngineerId !== undefined) dbData.assigned_engineer_id = data.assignedEngineerId;
      if (data.status !== undefined) dbData.status = data.status;

      const response = await apiService.put<{message: string, maintenanceRequest: any}>(`${this.baseUrl}/${id}`, dbData);
      return this.mapRowToMaintenanceRequest(response.maintenanceRequest);
    } catch (error) {
      console.error('MaintenanceService.updateMaintenanceRequest error:', error);
      throw new Error('Failed to update maintenance request');
    }
  }

  // Delete maintenance request with enhanced error handling
  async deleteMaintenanceRequest(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiService.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        message: 'Maintenance request deleted successfully'
      };
    } catch (error: any) {
      console.error('MaintenanceService.deleteMaintenanceRequest error:', error);

      // Handle specific error types
      if (error.status === 404 ||
          (error.data && error.data.error && error.data.error.includes('not found')) ||
          (error.message && error.message.includes('not found'))) {
        console.log(`Maintenance request ${id} already deleted`);
        return {
          success: true,
          message: 'Maintenance request was already deleted'
        };
      }

      // Handle other HTTP errors
      if (error.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      } else if (error.status === 403) {
        throw new Error('Forbidden: You do not have permission to delete maintenance requests');
      } else if (error.status >= 500) {
        throw new Error('Server error: Please try again later');
      }

      throw new Error(error.message || 'Failed to delete maintenance request');
    }
  }

  // Update request status
  async updateRequestStatus(id: string, status: MaintenanceStatus, reason?: string): Promise<MaintenanceRequest> {
    try {
      const response = await apiService.put<{message: string, maintenanceRequest: any}>(`${this.baseUrl}/${id}/status`, {
        status,
        notes: reason // Backend expects 'notes' not 'change_reason'
      });
      // Backend returns {message: "...", maintenanceRequest: {...}}
      return this.mapRowToMaintenanceRequest(response.maintenanceRequest);
    } catch (error) {
      console.error('MaintenanceService.updateRequestStatus error:', error);
      throw new Error('Failed to update request status');
    }
  }

  // Get work logs for a request
  async getWorkLogs(requestId: string): Promise<MaintenanceWorkLog[]> {
    try {
      const response = await apiService.get<{workLogs: any[]}>(`${this.baseUrl}/${requestId}/work-logs`);
      return response.workLogs.map(log => ({
        id: log.id.toString(),
        requestId: log.request_id || log.requestId,
        authorId: log.engineer_id || log.authorId, // Backend uses engineer_id
        author: {
          id: log.engineer_id?.toString() || '',
          username: log.user_name || '',
          email: log.email || '',
          firstName: log.first_name || '',
          lastName: log.last_name || '',
          role: 'User' as any,
          createdAt: '',
          updatedAt: ''
        },
        entryType: 'Work Log', // Default entry type
        title: log.title || 'Work Log Entry',
        description: log.work_description || log.description,
        hoursWorked: parseFloat(log.hours_spent || log.hours_worked || log.hoursWorked || 0),
        createdAt: log.work_date || log.created_at || log.createdAt
      }));
    } catch (error) {
      console.error('MaintenanceService.getWorkLogs error:', error);
      throw new Error('Failed to fetch work logs');
    }
  }

  // Add work log entry
  async addWorkLog(requestId: string, data: CreateWorkLogData): Promise<MaintenanceWorkLog> {
    try {
      const dbData = {
        entry_type: data.entryType || 'Note',
        title: data.title,
        description: data.description,
        hours_worked: data.hoursWorked || 0
      };

      const response = await apiService.post<any>(`${this.baseUrl}/${requestId}/work-logs`, dbData);
      return {
        id: response.id.toString(),
        requestId: response.request_id || response.requestId,
        authorId: response.author_id || response.authorId,
        author: response.author,
        entryType: response.entry_type || response.entryType,
        title: response.title,
        description: response.description,
        hoursWorked: parseFloat(response.hours_worked || response.hoursWorked || 0),
        createdAt: response.created_at || response.createdAt
      };
    } catch (error) {
      console.error('MaintenanceService.addWorkLog error:', error);
      throw new Error('Failed to add work log');
    }
  }

  // Get attachments for a request
  async getAttachments(requestId: string): Promise<MaintenanceAttachment[]> {
    try {
      const response = await apiService.get<any[]>(`${this.baseUrl}/${requestId}/attachments`);
      return response.map(attachment => ({
        id: attachment.id.toString(),
        requestId: attachment.request_id || attachment.requestId,
        uploadedById: attachment.uploaded_by_id || attachment.uploadedById,
        uploadedBy: attachment.uploaded_by || attachment.uploadedBy,
        originalFilename: attachment.original_filename || attachment.originalFilename,
        storedFilename: attachment.stored_filename || attachment.storedFilename,
        filePath: attachment.file_path || attachment.filePath,
        fileSize: attachment.file_size || attachment.fileSize,
        mimeType: attachment.mime_type || attachment.mimeType,
        attachmentType: attachment.attachment_type || attachment.attachmentType,
        description: attachment.description,
        createdAt: attachment.created_at || attachment.createdAt
      }));
    } catch (error) {
      console.error('MaintenanceService.getAttachments error:', error);
      throw new Error('Failed to fetch attachments');
    }
  }

  // Upload file attachment
  async uploadAttachment(
    requestId: string, 
    file: File, 
    attachmentType: AttachmentType = 'Other',
    description?: string
  ): Promise<MaintenanceAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachment_type', attachmentType);
      if (description) {
        formData.append('description', description);
      }

      const response = await apiService.postFormData<any>(`${this.baseUrl}/${requestId}/attachments`, formData);
      return {
        id: response.id.toString(),
        requestId: response.request_id || response.requestId,
        uploadedById: response.uploaded_by_id || response.uploadedById,
        uploadedBy: response.uploaded_by || response.uploadedBy,
        originalFilename: response.original_filename || response.originalFilename,
        storedFilename: response.stored_filename || response.storedFilename,
        filePath: response.file_path || response.filePath,
        fileSize: response.file_size || response.fileSize,
        mimeType: response.mime_type || response.mimeType,
        attachmentType: response.attachment_type || response.attachmentType,
        description: response.description,
        createdAt: response.created_at || response.createdAt
      };
    } catch (error) {
      console.error('MaintenanceService.uploadAttachment error:', error);
      throw new Error('Failed to upload attachment');
    }
  }

  // Delete attachment
  async deleteAttachment(requestId: string, attachmentId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${requestId}/attachments/${attachmentId}`);
    } catch (error) {
      console.error('MaintenanceService.deleteAttachment error:', error);
      throw new Error('Failed to delete attachment');
    }
  }

  // Get maintenance statistics
  async getMaintenanceStats(): Promise<MaintenanceStats> {
    try {
      const response = await apiService.get<any>(`${this.baseUrl}/stats`);
      
      // Transform backend response to match frontend interface
      return {
        totalRequests: response.totalRequests || 0,
        pendingRequests: response.statusCounts?.pending || 0,
        inProgressRequests: response.statusCounts?.inProgress || 0,
        completedRequests: response.statusCounts?.completed || 0,
        criticalRequests: response.priorityCounts?.critical || 0,
        highPriorityRequests: response.priorityCounts?.high || 0,
        requestsByCategory: response.requestsByCategory || {},
        requestsByStatus: response.requestsByStatus || response.statusCounts || {}
      };
    } catch (error) {
      console.error('MaintenanceService.getMaintenanceStats error:', error);
      throw new Error('Failed to fetch maintenance statistics');
    }
  }

  // Get status history for a request
  async getStatusHistory(requestId: string): Promise<MaintenanceStatusHistory[]> {
    try {
      const response = await apiService.get<{statusHistory: any[]}>(`${this.baseUrl}/${requestId}/status-history`);
      return response.statusHistory.map(history => ({
        id: history.id.toString(),
        requestId: history.request_id || history.requestId,
        oldStatus: history.old_status || history.oldStatus,
        newStatus: history.new_status || history.newStatus,
        changedById: history.changed_by_id || history.changedById,
        changedBy: {
          id: history.changed_by_id?.toString() || '',
          username: history.changed_by_name || '',
          email: history.email || '',
          firstName: history.first_name || '',
          lastName: history.last_name || '',
          role: 'User' as any,
          createdAt: '',
          updatedAt: ''
        },
        changeReason: history.change_reason || history.changeReason,
        createdAt: history.changed_at || history.created_at || history.createdAt
      }));
    } catch (error) {
      console.error('MaintenanceService.getStatusHistory error:', error);
      throw new Error('Failed to fetch status history');
    }
  }
}

export const maintenanceService = new MaintenanceService();
