import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Server,
  Rocket,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  FolderOpen,
} from "lucide-react";
import { useSuccessNotification } from "../hooks/useSuccessNotification";
import MaintenanceWidget from "./maintenance/MaintenanceWidget";
import { ensureArray } from "../utils/arrayValidation";

interface DashboardProps {
  data: any;
  onNavigate: (view: string, groupId?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  // Handle success notifications from URL parameters
  useSuccessNotification();

  const totalProjects = data.projects?.length || 0;
  const totalDeployments = data.deployments?.length || 0;
  const totalEngineers = data.engineers?.length || 0;
  const totalProjectGroups = data.projectGroups?.length || 0;
  const successfulDeployments = ensureArray(data.deployments).filter(
    (d: any) => d.status === "Success"
  ).length;
  const failedDeployments = ensureArray(data.deployments).filter(
    (d: any) => d.status === "Failed"
  ).length;
  const pendingDeployments = ensureArray(data.deployments).filter(
    (d: any) => d.status === "Pending"
  ).length;

  const successRate =
    totalDeployments > 0
      ? Math.round((successfulDeployments / totalDeployments) * 100)
      : 0;

  const stats = [
    {
      name: "Total Projects",
      value: totalProjects,
      icon: Server,
      color: "blue",
      path: "/projects",
    },
    {
      name: "Total Deployments",
      value: totalDeployments,
      icon: Rocket,
      color: "purple",
      path: "/deployments",
    },
    {
      name: "Project Groups",
      value: totalProjectGroups,
      icon: FolderOpen,
      color: "indigo",
      path: "/project-groups",
    },
    {
      name: "Engineers",
      value: totalEngineers,
      icon: Users,
      color: "green",
      path: "/engineers",
    },
    {
      name: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "orange",
      path: "/deployments?status=Success",
    },
  ];

  const groupStats = ensureArray(data.projectGroups).map((group: any) => ({
    ...group,
    projectCount: ensureArray(data.projects).filter(
      (p: any) => p.groupId === group.id
    ).length,
    deploymentCount: ensureArray(data.deployments).filter((d: any) => {
      const project = ensureArray(data.projects).find(
        (p: any) => p.id === d.projectId
      );
      return project?.groupId === group.id;
    }).length,
  }));

  const recentDeployments = ensureArray(data.deployments)
    .sort(
      (a: any, b: any) =>
        new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    )
    .slice(0, 5);

  // Calculate deployment counts per project for chart
  const projectDeploymentCounts = ensureArray(data.projects)
    .map((project: any) => {
      const deploymentCount = ensureArray(data.deployments).filter(
        (deployment: any) => deployment.projectId === project.id
      ).length;
      return {
        projectId: project.id,
        projectName: project.name,
        deploymentCount,
      };
    })
    .sort((a: any, b: any) => b.deploymentCount - a.deploymentCount); // Sort by deployment count descending

  const maxDeployments = Math.max(
    ...projectDeploymentCounts.map((p: any) => p.deploymentCount),
    1
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of all deployment activities
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            purple: "bg-purple-50 text-purple-600",
            indigo: "bg-indigo-50 text-indigo-600",
            green: "bg-green-50 text-green-600",
            orange: "bg-orange-50 text-orange-600",
          };

          return (
            <Link
              key={stat.name}
              to={stat.path}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center">
                <div
                  className={`p-3 rounded-lg transition-colors group-hover:scale-105 ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 group-hover:text-blue-500 transition-colors">
                    {stat.name}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Deployment Status
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Successful</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {successfulDeployments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {failedDeployments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {pendingDeployments}
              </span>
            </div>
          </div>
        </div>

        {/* Project Groups Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Groups
            </h3>
            <button
              onClick={() => onNavigate("project-groups")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {groupStats.map((group: any) => (
              <div
                key={group.id}
                onClick={() => onNavigate("project-groups", group.id)}
                className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-600">{group.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {group.projectCount} projects
                    </p>
                    <p className="text-sm text-gray-500">
                      {group.deploymentCount} deployments
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Requests Widget */}
        <MaintenanceWidget />
      </div>

      {/* Deployments per Project Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Deployments per Project
          </h3>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {projectDeploymentCounts.map((project: any) => (
            <div
              key={project.projectId}
              className="flex items-center space-x-4"
            >
              {/* Project Name */}
              <div className="w-40 flex-shrink-0">
                <p
                  className="text-sm font-medium text-gray-900 truncate"
                  title={project.projectName}
                >
                  {project.projectName}
                </p>
              </div>

              {/* Bar Chart */}
              <div className="flex-1 flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(
                        (project.deploymentCount / maxDeployments) * 100,
                        8
                      )}%`,
                    }}
                  >
                    {project.deploymentCount > 0 && (
                      <span className="text-xs font-semibold text-white">
                        {project.deploymentCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Count Badge */}
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {project.deploymentCount}{" "}
                    {project.deploymentCount === 1
                      ? "deployment"
                      : "deployments"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {projectDeploymentCounts.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No deployment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Link
              to="/deployments"
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Recent Deployments
            </Link>
            <Link
              to="/deployments"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engineer
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentDeployments.map((deployment: any) => {
                const project = ensureArray(data.projects).find(
                  (p: any) => p.id === deployment.projectId
                );
                // Use engineer data directly from deployment object
                const engineer = deployment.engineer;

                return (
                  <tr key={deployment.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Link
                        to={`/deployments/${deployment.id}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <p className="font-medium text-gray-900">
                          {project?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {project?.environment}
                        </p>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          deployment.status === "Success"
                            ? "bg-green-100 text-green-800"
                            : deployment.status === "Failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {deployment.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {engineer?.fullName ||
                        `${engineer?.firstName} ${engineer?.lastName}`.trim() ||
                        engineer?.username}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {new Date(deployment.deployedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
