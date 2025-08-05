import React, { useState } from 'react';
import { MaintenanceRequest } from '../../types';
import Breadcrumb, { useBreadcrumbs } from '../ui/Breadcrumb';
import MaintenanceRequestList from './MaintenanceRequestList';
import MaintenanceRequestForm from './MaintenanceRequestForm';
import MaintenanceRequestDetail from './MaintenanceRequestDetail';
import EditMaintenanceRequestModal from './EditMaintenanceRequestModal.tsx';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

const Maintenance: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Get breadcrumbs from the hook
  const breadcrumbs = useBreadcrumbs();

  // Create custom breadcrumbs based on current view mode
  const getCustomBreadcrumbs = () => {
    const baseBreadcrumbs = [];

    if (viewMode === 'detail' && selectedRequest) {
      baseBreadcrumbs.push(
        { label: 'Maintenance', href: '/maintenance' },
        { 
          label: selectedRequest.requestNumber || `Request #${selectedRequest.id}`,
          current: true
        }
      );
    } else if (viewMode === 'create') {
      baseBreadcrumbs.push(
        { label: 'Maintenance', href: '/maintenance' },
        { 
          label: 'New Request',
          current: true
        }
      );
    } else if (viewMode === 'edit' && selectedRequest) {
      baseBreadcrumbs.push(
        { label: 'Maintenance', href: '/maintenance' },
        { 
          label: `Edit ${selectedRequest.requestNumber || `Request #${selectedRequest.id}`}`,
          current: true
        }
      );
    } else {
      baseBreadcrumbs.push({
        label: 'Maintenance',
        current: true
      });
    }

    return baseBreadcrumbs;
  };

  // Handle navigation
  const handleCreateRequest = () => {
    setShowCreateModal(true);
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setViewMode('detail');
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRequest(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedRequest(null);
  };

  const handleEditFromDetail = () => {
    if (selectedRequest) {
      setShowEditModal(true);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={getCustomBreadcrumbs()} />

      <div className="space-y-6">
        {/* Main Content */}
        {viewMode === 'list' && (
          <MaintenanceRequestList
            onCreateRequest={handleCreateRequest}
            onViewRequest={handleViewRequest}
            onEditRequest={handleEditRequest}
          />
        )}

        {viewMode === 'detail' && selectedRequest && (
          <MaintenanceRequestDetail
            request={selectedRequest}
            onBack={handleBackToList}
            onEdit={handleEditFromDetail}
          />
        )}

        {/* Modals */}
        {showCreateModal && (
          <MaintenanceRequestForm
            isOpen={showCreateModal}
            onClose={handleCloseCreateModal}
          />
        )}

        {showEditModal && selectedRequest && (
          <EditMaintenanceRequestModal
            request={selectedRequest}
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
          />
        )}
      </div>
    </div>
  );
};

export default Maintenance;