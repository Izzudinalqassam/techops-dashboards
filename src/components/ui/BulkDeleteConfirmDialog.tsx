import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from './Button';

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  itemType: string;
  isDeleting?: boolean;
  title?: string;
  message?: string;
  warningMessage?: string;
}

const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  itemType,
  isDeleting = false,
  title,
  message,
  warningMessage,
}) => {
  if (!isOpen) return null;

  const defaultTitle = `Delete ${selectedCount} ${itemType}${selectedCount > 1 ? 's' : ''}`;
  const defaultMessage = `Are you sure you want to delete ${selectedCount} ${itemType}${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`;
  const defaultWarning = 'This action is permanent and cannot be undone.';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || defaultTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {message || defaultMessage}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Warning
                </h4>
                <p className="text-sm text-red-700">
                  {warningMessage || defaultWarning}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
            disabled={isDeleting}
            className="flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteConfirmDialog;
