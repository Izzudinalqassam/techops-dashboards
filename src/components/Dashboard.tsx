import React, { useState, useEffect } from "react";
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
  Wrench,
  AlertTriangle,
  Activity,
  Calendar,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useSuccessNotification } from "../hooks/useSuccessNotification";
import { useMaintenance } from "../hooks/useMaintenance";
import { ensureArray } from "../utils/arrayValidation";
import { convertToWIB, formatWIBTimestamp } from "../utils/timezone";
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, Deployment, Project } from "../types";

interface DashboardProps {
  data: {
    projects?: Project[];
    deployments?: Deployment[];
    engineers?: any[];
    projectGroups?: any[];
  };
  onNavigate: (view: string, groupId?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  // Handle success notifications from URL parameters
  useSuccessNotification();
  
  // Maintenance data
  const { requests: maintenanceRequests, stats: maintenanceStats, loading: maintenanceLoading, fetchRequests, fetchStats } = useMaintenance();
  
  // State for time period filter
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  useEffect(() => {
    fetchRequests().catch(console.error);
    fetchStats().catch(console.error);
  }, []);

  const totalProjects = data.projects?.length || 0;
  const totalDeployments = data.deployments?.length || 0;
  const totalEngineers = data.engineers?.length || 0;
  const totalProjectGroups = data.projectGroups?.length || 0;
  const deployments = ensureArray(data.deployments) as Deployment[];
  const successfulDeployments = deployments.filter(
    (d) => d.status === "completed"
  ).length;
  const failedDeployments = deployments.filter(
    (d) => d.status === "failed"
  ).length;
  const pendingDeployments = deployments.filter(
    (d) => d.status === "pending"
  ).length;

  const successRate =
    totalDeployments > 0
      ? Math.round((successfulDeployments / totalDeployments) * 100)
      : 0;

  // Calculate maintenance statistics
  const maintenanceData = React.useMemo(() => {
    if (!maintenanceRequests.length) return null;
    
    const now = new Date();
    const daysAgo = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const filteredRequests = maintenanceRequests.filter(
      req => new Date(req.createdAt) >= cutoffDate
    );
    
    const statusCounts = {
      pending: filteredRequests.filter(r => r.status === 'Pending').length,
      inProgress: filteredRequests.filter(r => r.status === 'In Progress').length,
      completed: filteredRequests.filter(r => r.status === 'Completed').length,
      onHold: filteredRequests.filter(r => r.status === 'On Hold').length,
      cancelled: filteredRequests.filter(r => r.status === 'Cancelled').length,
    };
    
    const priorityCounts = {
      low: filteredRequests.filter(r => r.priority === 'Low').length,
      medium: filteredRequests.filter(r => r.priority === 'Medium').length,
      high: filteredRequests.filter(r => r.priority === 'High').length,
      critical: filteredRequests.filter(r => r.priority === 'Critical').length,
    };
    
    const categoryCounts = {
      hardware: filteredRequests.filter(r => r.category === 'Hardware').length,
      software: filteredRequests.filter(r => r.category === 'Software').length,
      network: filteredRequests.filter(r => r.category === 'Network').length,
      general: filteredRequests.filter(r => r.category === 'General').length,
    };
    
    // Calculate daily trends for the last 7 days
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRequests = maintenanceRequests.filter(
        req => {
          const reqDate = new Date(req.createdAt);
          return reqDate >= dayStart && reqDate <= dayEnd;
        }
      );
      
      dailyTrends.push({
        date: dayStart.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        requests: dayRequests.length,
        completed: dayRequests.filter(r => r.status === 'Completed').length,
      });
    }
    
    const completionRate = filteredRequests.length > 0 
      ? Math.round((statusCounts.completed / filteredRequests.length) * 100)
      : 0;
    
    const avgResolutionTime = filteredRequests
      .filter(r => r.status === 'Completed' && r.completedDate)
      .reduce((acc, req) => {
        const created = new Date(req.createdAt);
        const completed = new Date(req.completedDate!);
        return acc + (completed.getTime() - created.getTime());
      }, 0) / Math.max(statusCounts.completed, 1);
    
    const avgResolutionDays = Math.round(avgResolutionTime / (1000 * 60 * 60 * 24));
    
    return {
      total: filteredRequests.length,
      statusCounts,
      priorityCounts,
      categoryCounts,
      dailyTrends,
      completionRate,
      avgResolutionDays,
    };
  }, [maintenanceRequests, timePeriod]);

  // Calculate deployment trends
  const deploymentTrends = React.useMemo(() => {
    if (!data.deployments?.length) return [];
    
    const now = new Date();
    const trends = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayDeployments = deployments.filter(
        (dep) => {
          const depDate = new Date(dep.deployedAt);
          return depDate >= dayStart && depDate <= dayEnd;
        }
      );
      
      trends.push({
        date: dayStart.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        total: dayDeployments.length,
        successful: dayDeployments.filter((d) => d.status === 'completed').length,
        failed: dayDeployments.filter((d) => d.status === 'failed').length,
      });
    }
    
    return trends;
  }, [data.deployments]);

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

  const projects = ensureArray(data.projects) as Project[];
  const projectGroups = ensureArray(data.projectGroups);
  const groupStats = projectGroups.map((group: any) => ({
    ...group,
    projectCount: projects.filter(
      (p) => p.groupId === group.id
    ).length,
    deploymentCount: deployments.filter((d) => {
      const project = projects.find(
        (p) => p.id === d.projectId
      );
      return project?.groupId === group.id;
    }).length,
  }));

  // Get top 3 project groups by total projects + deployments
  const topProjectGroups = groupStats
    .map((group: any) => ({
      ...group,
      totalActivity: group.projectCount + group.deploymentCount
    }))
    .sort((a: any, b: any) => b.totalActivity - a.totalActivity)
    .slice(0, 3);

  const recentDeployments = deployments
    .sort(
      (a, b) =>
        new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    )
    .slice(0, 5);

  // Calculate deployment counts per project for chart - top 3 only
  const projectDeploymentCounts = projects
    .map((project) => {
      const deploymentCount = deployments.filter(
        (deployment) => deployment.projectId === project.id
      ).length;
      return {
        projectId: project.id,
        projectName: project.name,
        deploymentCount,
      };
    })
    .sort((a, b) => b.deploymentCount - a.deploymentCount) // Sort by deployment count descending
    .slice(0, 3); // Show only top 3 projects with most deployments

  const maxDeployments = Math.max(
    ...projectDeploymentCounts.map((p: any) => p.deploymentCount),
    1
  );

  // Chart components
  const MaintenanceStatusChart = () => {
    if (!maintenanceData) return null;
    
    const { statusCounts } = maintenanceData;
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    
    const statusData = [
      { name: 'Completed', value: statusCounts.completed, color: 'bg-green-500', percentage: total > 0 ? Math.round((statusCounts.completed / total) * 100) : 0 },
      { name: 'In Progress', value: statusCounts.inProgress, color: 'bg-blue-500', percentage: total > 0 ? Math.round((statusCounts.inProgress / total) * 100) : 0 },
      { name: 'Pending', value: statusCounts.pending, color: 'bg-yellow-500', percentage: total > 0 ? Math.round((statusCounts.pending / total) * 100) : 0 },
      { name: 'On Hold', value: statusCounts.onHold, color: 'bg-orange-500', percentage: total > 0 ? Math.round((statusCounts.onHold / total) * 100) : 0 },
      { name: 'Cancelled', value: statusCounts.cancelled, color: 'bg-red-500', percentage: total > 0 ? Math.round((statusCounts.cancelled / total) * 100) : 0 },
    ];
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-blue-600" />
            Status Maintenance
          </h3>
          <select 
            value={timePeriod} 
            onChange={(e) => setTimePeriod(e.target.value as '7d' | '30d' | '90d')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="7d">7 Hari</option>
            <option value="30d">30 Hari</option>
            <option value="90d">90 Hari</option>
          </select>
        </div>
        <div className="space-y-3">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{item.value}</span>
                <span className="text-xs text-gray-500">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const TrendsChart = () => {
    // Pastikan ada data untuk ditampilkan
    if (!deploymentTrends.length && (!maintenanceData?.dailyTrends?.length)) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-blue-600" />
            Tren 7 Hari Terakhir
          </h3>
          <div className="text-center py-8">
            <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada data untuk ditampilkan</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(
      ...deploymentTrends.map(d => d.total),
      ...(maintenanceData?.dailyTrends?.map(d => d.requests) || []),
      1 // Minimal value 1 untuk menghindari pembagian dengan 0
    );

    // Prepare data for line chart
    const chartWidth = 400;
    const chartHeight = 200;
    const padding = 40;
    const dataPoints = deploymentTrends.length;
    
    // Calculate points for deployment line
    const deploymentPoints = deploymentTrends.map((trend, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (dataPoints - 1);
      const y = chartHeight - padding - ((trend.total / maxValue) * (chartHeight - 2 * padding));
      return { x, y, value: trend.total };
    });
    
    // Calculate points for maintenance line
    const maintenancePoints = deploymentTrends.map((trend, index) => {
      const maintenanceTrend = maintenanceData?.dailyTrends?.[index];
      const value = maintenanceTrend?.requests || 0;
      const x = padding + (index * (chartWidth - 2 * padding)) / (dataPoints - 1);
      const y = chartHeight - padding - ((value / maxValue) * (chartHeight - 2 * padding));
      return { x, y, value };
    });
    
    // Create path strings for lines
    const deploymentPath = deploymentPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
      
    const maintenancePath = maintenancePoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LineChart className="h-5 w-5 mr-2 text-blue-600" />
          Tren 7 Hari Terakhir
        </h3>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Deployment</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Maintenance</span>
          </div>
        </div>
        
        {/* Line Chart */}
        <div className="relative">
          <svg width={chartWidth} height={chartHeight} className="mx-auto">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = chartHeight - padding - (ratio * (chartHeight - 2 * padding));
              const value = Math.round(maxValue * ratio);
              return (
                <g key={index}>
                  <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#9ca3af" strokeWidth="1" />
                  <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-500">
                    {value}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {deploymentTrends.map((trend, index) => {
              const x = padding + (index * (chartWidth - 2 * padding)) / (dataPoints - 1);
              return (
                <g key={index}>
                  <line x1={x} y1={chartHeight - padding} x2={x} y2={chartHeight - padding + 5} stroke="#9ca3af" strokeWidth="1" />
                  <text x={x} y={chartHeight - padding + 18} textAnchor="middle" className="text-xs fill-gray-500">
                    {trend.date.split(' ')[0]}
                  </text>
                </g>
              );
            })}
            
            {/* Deployment line */}
            <path
              d={deploymentPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Maintenance line */}
            <path
              d={maintenancePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Deployment points */}
            {deploymentPoints.map((point, index) => (
              <g key={`deploy-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                />
                <title>{`${deploymentTrends[index].date}: ${point.value} deployments`}</title>
              </g>
            ))}
            
            {/* Maintenance points */}
            {maintenancePoints.map((point, index) => (
              <g key={`maintenance-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#f97316"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                />
                <title>{`${deploymentTrends[index].date}: ${point.value} maintenance requests`}</title>
              </g>
            ))}
          </svg>
        </div>
        
        {/* Data summary */}
        <div className="mt-4 grid grid-cols-7 gap-2 text-xs">
          {deploymentTrends.map((trend, index) => {
            const maintenanceTrend = maintenanceData?.dailyTrends?.[index];
            return (
              <div key={`summary-${index}`} className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">{trend.date.split(' ')[1]}</div>
                <div className="text-blue-600 font-semibold">{trend.total}</div>
                <div className="text-orange-600 font-semibold">{maintenanceTrend?.requests || 0}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
        
        {/* Maintenance Stats */}
        {maintenanceData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 group">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600 transition-colors group-hover:scale-105">
                <Wrench className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {maintenanceData.total}
                </p>
                <p className="text-sm text-gray-600 group-hover:text-orange-500 transition-colors">
                  Total Maintenance
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {maintenanceData.completionRate}% selesai
                </p>
              </div>
            </div>
          </div>
        )}
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
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Top 3 Project Groups
              </h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Most Active
              </span>
            </div>
            <button
              onClick={() => onNavigate("project-groups")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topProjectGroups.map((group: any) => (
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

        {/* Maintenance Status Chart */}
        <MaintenanceStatusChart />
      </div>

      {/* Maintenance Metrics */}
       {maintenanceData && (
         <div className="bg-white p-6 rounded-lg shadow-sm border">
           <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
             <Activity className="h-6 w-6 mr-2 text-blue-600" />
             Metrik Maintenance
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="text-center">
               <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                 <CheckCircle className="h-6 w-6 text-green-600" />
               </div>
               <p className="text-2xl font-bold text-gray-900">{maintenanceData.completionRate}%</p>
               <p className="text-sm text-gray-600">Tingkat Penyelesaian</p>
             </div>
             <div className="text-center">
               <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                 <Clock className="h-6 w-6 text-blue-600" />
               </div>
               <p className="text-2xl font-bold text-gray-900">{maintenanceData.avgResolutionDays}</p>
               <p className="text-sm text-gray-600">Rata-rata Hari</p>
             </div>
             <div className="text-center">
               <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
                 <AlertTriangle className="h-6 w-6 text-red-600" />
               </div>
               <p className="text-2xl font-bold text-gray-900">{maintenanceData.priorityCounts.critical + maintenanceData.priorityCounts.high}</p>
               <p className="text-sm text-gray-600">Prioritas Tinggi</p>
             </div>
             <div className="text-center">
               <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3">
                 <Calendar className="h-6 w-6 text-yellow-600" />
               </div>
               <p className="text-2xl font-bold text-gray-900">{maintenanceData.statusCounts.pending + maintenanceData.statusCounts.inProgress}</p>
               <p className="text-sm text-gray-600">Sedang Berjalan</p>
             </div>
           </div>
         </div>
       )}

       {/* Charts Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <TrendsChart />
         <MaintenanceStatusChart />
       </div>

       {/* Priority & Category Breakdown */}
       {maintenanceData && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Priority Breakdown */}
           <div className="bg-white p-6 rounded-lg shadow-sm border">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
               <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
               Berdasarkan Prioritas
             </h3>
             <div className="space-y-3">
               {[
                 { name: 'Critical', value: maintenanceData.priorityCounts.critical, color: 'bg-red-500', textColor: 'text-red-700' },
                 { name: 'High', value: maintenanceData.priorityCounts.high, color: 'bg-orange-500', textColor: 'text-orange-700' },
                 { name: 'Medium', value: maintenanceData.priorityCounts.medium, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                 { name: 'Low', value: maintenanceData.priorityCounts.low, color: 'bg-green-500', textColor: 'text-green-700' },
               ].map((item) => {
                 const percentage = maintenanceData.total > 0 ? Math.round((item.value / maintenanceData.total) * 100) : 0;
                 return (
                   <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center">
                       <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                       <span className={`text-sm font-medium ${item.textColor}`}>{item.name}</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium">{item.value}</span>
                       <span className="text-xs text-gray-500">({percentage}%)</span>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>

           {/* Category Breakdown */}
           <div className="bg-white p-6 rounded-lg shadow-sm border">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
               <Server className="h-5 w-5 mr-2 text-blue-600" />
               Berdasarkan Kategori
             </h3>
             <div className="space-y-3">
               {[
                 { name: 'Hardware', value: maintenanceData.categoryCounts.hardware, color: 'bg-blue-500' },
                 { name: 'Software', value: maintenanceData.categoryCounts.software, color: 'bg-purple-500' },
                 { name: 'Network', value: maintenanceData.categoryCounts.network, color: 'bg-indigo-500' },
                 { name: 'General', value: maintenanceData.categoryCounts.general, color: 'bg-gray-500' },
               ].map((item) => {
                 const percentage = maintenanceData.total > 0 ? Math.round((item.value / maintenanceData.total) * 100) : 0;
                 return (
                   <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center">
                       <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                       <span className="text-sm text-gray-600">{item.name}</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium">{item.value}</span>
                       <span className="text-xs text-gray-500">({percentage}%)</span>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         </div>
       )}

      {/* Deployments per Project Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Top 3 Deployments per Project
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Top 3
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate("projects")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
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
              {recentDeployments.map((deployment) => {
                const project = projects.find(
                  (p) => p.id === deployment.projectId
                );
                // Use engineer data directly from deployment object
                const engineer = deployment.engineer;

                return (
                  <tr key={deployment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/projects/${deployment.projectId}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <p className="font-medium text-gray-900">
                          {project?.name}
                        </p>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          deployment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : deployment.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {deployment.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {engineer?.fullName || 'Unknown'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                       {deployment.deployedAt ? formatWIBTimestamp(deployment.deployedAt, {
                         year: 'numeric',
                         month: 'short',
                         day: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit',
                         hour12: false,
                         timeZone: 'Asia/Jakarta'
                       }) : 'N/A'}
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
