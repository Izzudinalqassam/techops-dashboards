import React from "react";
import { User, Mail, Shield, Activity } from "lucide-react";
import StatusBadge from "./ui/StatusBadge";

interface EngineersProps {
  data: any;
}

const Engineers: React.FC<EngineersProps> = ({ data }) => {
  const engineers = data.engineers || [];

  // Calculate stats for each engineer
  const engineersWithStats = engineers.map((engineer: any) => {
    const engineerDeployments = data.deployments.filter(
      (d: any) => d.engineerId === engineer.id
    );
    const successfulDeployments = engineerDeployments.filter(
      (d: any) => d.status === "Success"
    ).length;
    const totalDeployments = engineerDeployments.length;
    const successRate = totalDeployments > 0 
      ? Math.round((successfulDeployments / totalDeployments) * 100) 
      : 0;

    return {
      ...engineer,
      totalDeployments,
      successfulDeployments,
      successRate,
    };
  });

  const getRoleBadgeStatus = (role: string) => {
    switch (role) {
      case "admin":
        return "Success";
      case "manager":
        return "Staging";
      default:
        return "Development";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Engineers</h1>
        <p className="text-gray-600">
          Manage team members and view their deployment statistics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{engineers.length}</p>
              <p className="text-sm text-gray-600">Total Engineers</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {engineers.filter((e: any) => e.isActive).length}
              </p>
              <p className="text-sm text-gray-600">Active Engineers</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {engineers.filter((e: any) => e.role === "Admin").length}
              </p>
              <p className="text-sm text-gray-600">Administrators</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engineers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engineersWithStats.map((engineer: any) => (
          <div
            key={engineer.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            {/* Engineer Header */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {engineer.firstName} {engineer.lastName}
                </h3>
                <p className="text-sm text-gray-600">@{engineer.username}</p>
              </div>
              <StatusBadge 
                status={getRoleBadgeStatus(engineer.role)} 
                size="sm" 
                showIcon={false}
              />
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{engineer.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span className="capitalize">{engineer.role}</span>
              </div>
            </div>

            {/* Deployment Stats */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Deployment Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {engineer.totalDeployments}
                  </p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {engineer.successRate}%
                  </p>
                  <p className="text-xs text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      engineer.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {engineer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {engineers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No engineers found
          </h3>
          <p className="text-gray-600">
            Engineers will appear here once they are added to the system.
          </p>
        </div>
      )}
    </div>
  );
};

export default Engineers;
