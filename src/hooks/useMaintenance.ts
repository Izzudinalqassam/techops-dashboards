import { useState, useCallback, useEffect } from 'react';
import { 
  MaintenanceRequest, 
  MaintenanceWorkLog, 
  MaintenanceAttachment, 
  MaintenanceStatusHistory,
  MaintenanceStatus,
  AttachmentType
} from '../types';
import { 
  maintenanceService, 
  CreateMaintenanceRequestData, 
  UpdateMaintenanceRequestData, 
  CreateWorkLogData,
  MaintenanceFilters,
  MaintenanceStats
} from '../services/maintenanceService';

interface UseMaintenanceReturn {
  // State
  requests: MaintenanceRequest[];
  currentRequest: MaintenanceRequest | null;
  workLogs: MaintenanceWorkLog[];
  attachments: MaintenanceAttachment[];
  statusHistory: MaintenanceStatusHistory[];
  stats: MaintenanceStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchRequests: (filters?: MaintenanceFilters) => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  createRequest: (data: CreateMaintenanceRequestData) => Promise<MaintenanceRequest>;
  updateRequest: (id: string, data: UpdateMaintenanceRequestData) => Promise<MaintenanceRequest>;
  deleteRequest: (id: string) => Promise<{ success: boolean; message: string }>;
  updateRequestStatus: (id: string, status: MaintenanceStatus, reason?: string) => Promise<MaintenanceRequest>;
  
  // Work logs
  fetchWorkLogs: (requestId: string) => Promise<void>;
  addWorkLog: (requestId: string, data: CreateWorkLogData) => Promise<MaintenanceWorkLog>;
  
  // Attachments
  fetchAttachments: (requestId: string) => Promise<void>;
  uploadAttachment: (requestId: string, file: File, type?: AttachmentType, description?: string) => Promise<MaintenanceAttachment>;
  deleteAttachment: (requestId: string, attachmentId: string) => Promise<void>;
  
  // Status history
  fetchStatusHistory: (requestId: string) => Promise<void>;
  
  // Statistics
  fetchStats: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearCurrentRequest: () => void;
}

export const useMaintenance = (): UseMaintenanceReturn => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<MaintenanceRequest | null>(null);
  const [workLogs, setWorkLogs] = useState<MaintenanceWorkLog[]>([]);
  const [attachments, setAttachments] = useState<MaintenanceAttachment[]>([]);
  const [statusHistory, setStatusHistory] = useState<MaintenanceStatusHistory[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all maintenance requests
  const fetchRequests = useCallback(async (filters?: MaintenanceFilters): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const fetchedRequests = await maintenanceService.getMaintenanceRequests(filters);
      setRequests(fetchedRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch maintenance requests';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch maintenance request by ID
  const fetchRequestById = useCallback(async (id: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const request = await maintenanceService.getMaintenanceRequestById(id);
      setCurrentRequest(request);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch maintenance request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new maintenance request
  const createRequest = useCallback(async (data: CreateMaintenanceRequestData): Promise<MaintenanceRequest> => {
    setError(null);
    try {
      const newRequest = await maintenanceService.createMaintenanceRequest(data);
      setRequests(prev => [newRequest, ...prev]);
      return newRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create maintenance request';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update maintenance request
  const updateRequest = useCallback(async (id: string, data: UpdateMaintenanceRequestData): Promise<MaintenanceRequest> => {
    setError(null);
    try {
      const updatedRequest = await maintenanceService.updateMaintenanceRequest(id, data);
      setRequests(prev => prev.map(request => request.id === id ? updatedRequest : request));
      if (currentRequest?.id === id) {
        setCurrentRequest(updatedRequest);
      }
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update maintenance request';
      setError(errorMessage);
      throw err;
    }
  }, [currentRequest]);

  // Fetch work logs
  const fetchWorkLogs = useCallback(async (requestId: string): Promise<void> => {
    setError(null);
    try {
      const logs = await maintenanceService.getWorkLogs(requestId);
      setWorkLogs(logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work logs';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Fetch status history
  const fetchStatusHistory = useCallback(async (requestId: string): Promise<void> => {
    setError(null);
    try {
      const history = await maintenanceService.getStatusHistory(requestId);
      setStatusHistory(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status history';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Track deletion in progress to prevent multiple simultaneous deletions
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Delete maintenance request with enhanced error handling
  const deleteRequest = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    // Prevent multiple simultaneous deletions of the same request
    if (deletingIds.has(id)) {
      console.log(`Delete already in progress for request ${id}`);
      return { success: true, message: 'Delete operation already in progress' };
    }

    setError(null);
    setDeletingIds(prev => new Set(prev).add(id));

    try {
      const result = await maintenanceService.deleteMaintenanceRequest(id);

      // Always update UI on successful response (even if already deleted)
      setRequests(prev => prev.filter(request => request.id !== id));
      if (currentRequest?.id === id) {
        setCurrentRequest(null);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete maintenance request';
      console.error('Delete maintenance request error:', err);
      setError(errorMessage);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [currentRequest, deletingIds]);

  // Update request status
  const updateRequestStatus = useCallback(async (id: string, status: MaintenanceStatus, reason?: string): Promise<MaintenanceRequest> => {
    setError(null);
    try {
      const updatedRequest = await maintenanceService.updateRequestStatus(id, status, reason);
      setRequests(prev => prev.map(request => request.id === id ? updatedRequest : request));
      if (currentRequest?.id === id) {
        setCurrentRequest(updatedRequest);
        // Refresh related data after status update
        await Promise.all([
          fetchStatusHistory(id),
          fetchWorkLogs(id)
        ]);
      }
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update request status';
      setError(errorMessage);
      throw err;
    }
  }, [currentRequest, fetchStatusHistory, fetchWorkLogs]);

  // Add work log
  const addWorkLog = useCallback(async (requestId: string, data: CreateWorkLogData): Promise<MaintenanceWorkLog> => {
    setError(null);
    try {
      const newLog = await maintenanceService.addWorkLog(requestId, data);
      setWorkLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add work log';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Fetch attachments
  const fetchAttachments = useCallback(async (requestId: string): Promise<void> => {
    setError(null);
    try {
      const fetchedAttachments = await maintenanceService.getAttachments(requestId);
      setAttachments(fetchedAttachments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attachments';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Upload attachment
  const uploadAttachment = useCallback(async (
    requestId: string, 
    file: File, 
    type: AttachmentType = 'Other',
    description?: string
  ): Promise<MaintenanceAttachment> => {
    setError(null);
    try {
      const newAttachment = await maintenanceService.uploadAttachment(requestId, file, type, description);
      setAttachments(prev => [newAttachment, ...prev]);
      return newAttachment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload attachment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete attachment
  const deleteAttachment = useCallback(async (requestId: string, attachmentId: string): Promise<void> => {
    setError(null);
    try {
      await maintenanceService.deleteAttachment(requestId, attachmentId);
      setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete attachment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const fetchedStats = await maintenanceService.getMaintenanceStats();
      setStats(fetchedStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch maintenance statistics';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current request
  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(null);
    setWorkLogs([]);
    setAttachments([]);
    setStatusHistory([]);
  }, []);

  return {
    // State
    requests,
    currentRequest,
    workLogs,
    attachments,
    statusHistory,
    stats,
    loading,
    error,

    // Actions
    fetchRequests,
    fetchRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    updateRequestStatus,

    // Work logs
    fetchWorkLogs,
    addWorkLog,

    // Attachments
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,

    // Status history
    fetchStatusHistory,

    // Statistics
    fetchStats,

    // Utility
    clearError,
    clearCurrentRequest,
  };
};
