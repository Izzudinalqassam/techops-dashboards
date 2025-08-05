import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = false 
}) => {
  return (
    <div 
      className={`
        animate-pulse bg-gray-200 
        ${width} ${height} 
        ${rounded ? 'rounded-full' : 'rounded'} 
        ${className}
      `}
    />
  );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="w-48" height="h-8" />
        <Skeleton width="w-64" height="h-4" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <Skeleton width="w-12" height="h-12" rounded />
              <div className="ml-4 space-y-2 flex-1">
                <Skeleton width="w-16" height="h-8" />
                <Skeleton width="w-24" height="h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts/Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Skeleton width="w-32" height="h-6" className="mb-4" />
          <Skeleton width="w-full" height="h-64" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Skeleton width="w-32" height="h-6" className="mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton width="w-8" height="h-8" rounded />
                <div className="flex-1 space-y-1">
                  <Skeleton width="w-3/4" height="h-4" />
                  <Skeleton width="w-1/2" height="h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Projects List Skeleton
export const ProjectsListSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="w-32" height="h-8" />
          <Skeleton width="w-48" height="h-4" />
        </div>
        <Skeleton width="w-32" height="h-10" />
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Skeleton width="w-48" height="h-10" />
        <Skeleton width="w-32" height="h-10" />
        <Skeleton width="w-24" height="h-10" />
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="w-8" height="h-8" rounded />
              <Skeleton width="w-16" height="h-6" />
            </div>
            <div className="space-y-3">
              <Skeleton width="w-3/4" height="h-6" />
              <Skeleton width="w-full" height="h-4" />
              <Skeleton width="w-2/3" height="h-4" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Skeleton width="w-20" height="h-4" />
              <Skeleton width="w-24" height="h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Deployments List Skeleton
export const DeploymentsListSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="w-40" height="h-8" />
          <Skeleton width="w-56" height="h-4" />
        </div>
        <div className="flex space-x-3">
          <Skeleton width="w-24" height="h-10" />
          <Skeleton width="w-32" height="h-10" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton width="w-16" height="h-4" />
                <Skeleton width="w-8" height="h-6" />
              </div>
              <Skeleton width="w-6" height="h-6" rounded />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Skeleton width="w-48" height="h-10" />
        <Skeleton width="w-32" height="h-10" />
        <Skeleton width="w-24" height="h-10" />
      </div>

      {/* Deployment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton width="w-10" height="h-10" rounded />
                <div className="space-y-1">
                  <Skeleton width="w-32" height="h-5" />
                  <Skeleton width="w-24" height="h-4" />
                </div>
              </div>
              <Skeleton width="w-20" height="h-6" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Skeleton width="w-4" height="h-4" rounded />
                <Skeleton width="w-28" height="h-4" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton width="w-4" height="h-4" rounded />
                <Skeleton width="w-20" height="h-4" />
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <Skeleton width="w-16" height="h-8" />
              <Skeleton width="w-20" height="h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-6">
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} width="w-24" height="h-4" />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex space-x-6">
              {[...Array(columns)].map((_, j) => (
                <Skeleton key={j} width="w-20" height="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
