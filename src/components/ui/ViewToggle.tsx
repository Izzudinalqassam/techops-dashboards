import React from 'react';
import { Grid, List, Table } from 'lucide-react';

export type ViewMode = 'cards' | 'table' | 'list';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[];
  className?: string;
}

const viewConfig = {
  cards: {
    icon: Grid,
    label: 'Cards',
    tooltip: 'Card view'
  },
  table: {
    icon: Table,
    label: 'Table',
    tooltip: 'Table view'
  },
  list: {
    icon: List,
    label: 'List',
    tooltip: 'List view'
  }
};

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  availableViews = ['cards', 'table'],
  className = ''
}) => {
  return (
    <div className={`flex items-center bg-gray-100 rounded-lg p-1 ${className}`}>
      {availableViews.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = currentView === view;
        
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`
              flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            title={config.tooltip}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
