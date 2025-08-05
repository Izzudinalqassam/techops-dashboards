import React from 'react';
import { Trash2, X } from 'lucide-react';
import Button from './Button';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
  deleteLabel?: string;
  className?: string;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onDelete,
  onClearSelection,
  isDeleting = false,
  deleteLabel = 'Delete Selected',
  className = '',
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-blue-700">
            <span className="font-medium">{selectedCount}</span> of{' '}
            <span className="font-medium">{totalCount}</span> items selected
          </div>
          <button
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear Selection</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={onDelete}
            variant="danger"
            size="sm"
            disabled={isDeleting}
            className="flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : deleteLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
