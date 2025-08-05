import React from "react";
import { Link } from "react-router-dom";
import {
  Server,
  Users,
  Rocket,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Project, Engineer, ProjectGroup } from "../../types";
import { ensureArray } from "../../utils/arrayValidation";

interface ProjectStatisticsProps {
  data: {
    projects: Project[];
    engineers: Engineer[];
    projectGroups: ProjectGroup[];
    deployments: any[];
  };
}

const ProjectStatistics: React.FC<ProjectStatisticsProps> = ({ data }) => {
  const projects = ensureArray(data.projects);
  const engineers = ensureArray(data.engineers);
  const projectGroups = ensureArray(data.projectGroups);
  const deployments = ensureArray(data.deployments);

  // Calculate project statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const inactiveProjects = projects.filter((p) => p.status === "inactive").length;
  const maintenanceProjects = projects.filter((p) => p.status === "maintenance").length;

  // Calculate engineer assignments
  const assignedProjects = projects.filter((p) => p.assignedEngineerId).length;
  const unassignedProjects = totalProjects - assignedProjects;
  const uniqueEngineersAssigned = new Set(
    projects
      .filter((p) => p.assignedEngineerId)
      .map((p) => p.assignedEngineerId)
  ).size;

  // Calculate deployment statistics for projects
  const projectsWithDeployments = projects.filter((p) =>
    deployments.some((d) => d.projectId === p.id)
  ).length;
  const totalProjectDeployments = deployments.filter((d) =>
    projects.some((p) => p.id === d.projectId)
  ).length;

  // Calculate recent activity (projects created in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentProjects = projects.filter(
    (p) => new Date(p.createdAt) > thirtyDaysAgo
  ).length;

  // Calculate project group distribution
  const projectGroupStats = projectGroups.map((group) => ({
    ...group,
    projectCount: projects.filter((p) => String(p.groupId) === String(group.id)).length,
  })).sort((a, b) => b.projectCount - a.projectCount);

  const topProjectGroup = projectGroupStats[0];

  // Main statistics cards
  const mainStats = [
    {
      name: "Total Projects",
      value: totalProjects,
      icon: Server,
      color: "blue",
      description: "All projects in portfolio",
    },
    {
      name: "Active Projects",
      value: activeProjects,
      icon: CheckCircle,
      color: "green",
      description: "Currently active projects",
    },
    {
      name: "Assigned Engineers",
      value: uniqueEngineersAssigned,
      icon: Users,
      color: "purple",
      description: "Engineers with project assignments",
    },
    {
      name: "Total Deployments",
      value: totalProjectDeployments,
      icon: Rocket,
      color: "orange",
      description: "Deployments across all projects",
    },
  ];

  // Status breakdown
  const statusStats = [
    {
      label: "Active",
      count: activeProjects,
      color: "bg-green-500",
      percentage: totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0,
    },
    {
      label: "Inactive",
      count: inactiveProjects,
      color: "bg-red-500",
      percentage: totalProjects > 0 ? Math.round((inactiveProjects / totalProjects) * 100) : 0,
    },
    {
      label: "Maintenance",
      count: maintenanceProjects,
      color: "bg-yellow-500",
      percentage: totalProjects > 0 ? Math.round((maintenanceProjects / totalProjects) * 100) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            green: "bg-green-50 text-green-600",
            purple: "bg-purple-50 text-purple-600",
            orange: "bg-orange-50 text-orange-600",
          };

          return (
            <Card key={stat.name} hover>
              <CardContent>
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-lg ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Status
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusStats.map((status) => (
                <div key={status.label} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${status.color} mr-3`} />
                    <span className="text-sm text-gray-600">{status.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {status.count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({status.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Engineer Assignments
              </h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Assigned Projects</span>
                <span className="text-sm font-semibold text-gray-900">
                  {assignedProjects}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unassigned Projects</span>
                <span className="text-sm font-semibold text-gray-900">
                  {unassignedProjects}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Engineers</span>
                <span className="text-sm font-semibold text-gray-900">
                  {uniqueEngineersAssigned}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assignment Rate</span>
                  <span className="text-sm font-semibold text-green-600">
                    {totalProjects > 0 
                      ? Math.round((assignedProjects / totalProjects) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Deployment Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity Overview
              </h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Recent Projects</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {recentProjects}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Rocket className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="text-sm text-gray-600">With Deployments</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {projectsWithDeployments}
                </span>
              </div>
              {topProjectGroup && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Top Group</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {topProjectGroup.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {topProjectGroup.projectCount} projects
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectStatistics;
