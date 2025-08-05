import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useMaintenance } from "../../hooks/useMaintenance";
import { MaintenanceStatus, MaintenancePriority } from "../../types";

const MaintenanceWidget: React.FC = () => {
  const { requests, stats, loading, error, fetchRequests, fetchStats } =
    useMaintenance();

  useEffect(() => {
    fetchRequests().catch(console.error);
    fetchStats().catch(console.error);
  }, []); // Empty dependency array - only run on mount

  // Calculate quick stats from requests if stats API is not available
  const quickStats = React.useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Pending").length;
    const inProgress = requests.filter(
      (r) => r.status === "In Progress"
    ).length;
    const critical = requests.filter((r) => r.priority === "Critical").length;
    const completed = requests.filter((r) => r.status === "Completed").length;

    return {
      totalRequests: total,
      pendingRequests: pending,
      inProgressRequests: inProgress,
      criticalRequests: critical,
      completedRequests: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [requests]);

  // Use stats from API if available, otherwise use calculated stats from requests
  const displayStats = React.useMemo(() => {
    if (stats) {
      return {
        totalRequests: stats.totalRequests,
        pendingRequests: stats.pendingRequests,
        inProgressRequests: stats.inProgressRequests,
        criticalRequests: stats.criticalRequests,
        completedRequests: stats.completedRequests,
        completionRate:
          stats.totalRequests > 0
            ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
            : 0,
      };
    }
    return quickStats;
  }, [stats, quickStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "inProgress":
        return "text-blue-600 bg-blue-100";
      case "critical":
        return "text-red-600 bg-red-100";
      case "completed":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "inProgress":
        return TrendingUp;
      case "critical":
        return AlertTriangle;
      case "completed":
        return CheckCircle;
      default:
        return Wrench;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar skeleton */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>

          {/* Buttons skeleton */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-2">
              <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Wrench className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Maintenance Requests
          </h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load maintenance data</p>
      </div>
    );
  }

  const statItems = [
    {
      label: "Pending",
      value: displayStats.pendingRequests || 0,
      key: "pending",
    },
    {
      label: "In Progress",
      value: displayStats.inProgressRequests || 0,
      key: "inProgress",
    },
    {
      label: "Critical",
      value: displayStats.criticalRequests || 0,
      key: "critical",
    },
    {
      label: "Completed",
      value: displayStats.completedRequests || 0,
      key: "completed",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Maintenance Requests
            </h3>
            <p className="text-sm text-gray-500">
              {displayStats.totalRequests || 0} total requests
            </p>
          </div>
        </div>
        <Link
          to="/maintenance"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid - Improved responsive design */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {statItems.map((item) => {
          const IconComponent = getStatusIcon(item.key);
          const colorClasses = getStatusColor(item.key);

          return (
            <div key={item.key} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Rate */}
      {displayStats.totalRequests > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Completion Rate
            </span>
            <span className="text-sm font-bold text-gray-900">
              {displayStats.completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${displayStats.completionRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex space-x-2">
          <Link
            to="/maintenance"
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors text-center"
          >
            View Requests
          </Link>
          <Link
            to="/maintenance"
            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors text-center"
          >
            Create Request
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceWidget;
