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
    const [hoveredPoint, setHoveredPoint] = React.useState<{ type: string; index: number; x: number; y: number } | null>(null);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      setIsVisible(true);
    }, []);

    // Pastikan ada data untuk ditampilkan
    if (!deploymentTrends.length && (!maintenanceData?.dailyTrends?.length)) {
      return (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Tren 7 Hari Terakhir
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-20 animate-pulse"></div>
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4 relative z-10" />
            </div>
            <p className="text-gray-500 text-lg">Belum ada data untuk ditampilkan</p>
            <p className="text-gray-400 text-sm mt-2">Data akan muncul setelah ada aktivitas deployment dan maintenance</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(
      ...deploymentTrends.map(d => d.total),
      ...(maintenanceData?.dailyTrends?.map(d => d.requests) || []),
      1 // Minimal value 1 untuk menghindari pembagian dengan 0
    );

    // Responsive chart dimensions
    const chartWidth = 500;
    const chartHeight = 280;
    const padding = 60;
    const dataPoints = deploymentTrends.length;
    
    // Calculate points for deployment line
    const deploymentPoints = deploymentTrends.map((trend, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / Math.max(dataPoints - 1, 1);
      const y = chartHeight - padding - ((trend.total / maxValue) * (chartHeight - 2 * padding));
      return { x, y, value: trend.total, date: trend.date };
    });
    
    // Calculate points for maintenance line
    const maintenancePoints = deploymentTrends.map((trend, index) => {
      const maintenanceTrend = maintenanceData?.dailyTrends?.[index];
      const value = maintenanceTrend?.requests || 0;
      const x = padding + (index * (chartWidth - 2 * padding)) / Math.max(dataPoints - 1, 1);
      const y = chartHeight - padding - ((value / maxValue) * (chartHeight - 2 * padding));
      return { x, y, value, date: trend.date };
    });
    
    // Create smooth curve paths using quadratic bezier curves
    const createSmoothPath = (points: typeof deploymentPoints) => {
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        const controlX = (prevPoint.x + currentPoint.x) / 2;
        
        path += ` Q ${controlX} ${prevPoint.y} ${currentPoint.x} ${currentPoint.y}`;
      }
      
      return path;
    };
    
    const deploymentPath = createSmoothPath(deploymentPoints);
    const maintenancePath = createSmoothPath(maintenancePoints);
    
    // Create area paths for gradient fills
    const createAreaPath = (points: typeof deploymentPoints) => {
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${chartHeight - padding}`;
      path += ` L ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        const controlX = (prevPoint.x + currentPoint.x) / 2;
        
        path += ` Q ${controlX} ${prevPoint.y} ${currentPoint.x} ${currentPoint.y}`;
      }
      
      path += ` L ${points[points.length - 1].x} ${chartHeight - padding} Z`;
      return path;
    };
    
    const deploymentAreaPath = createAreaPath(deploymentPoints);
    const maintenanceAreaPath = createAreaPath(maintenancePoints);
    
    return (
      <div className={`bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Tren 7 Hari Terakhir
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
        
        {/* Enhanced Legend */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="flex items-center group cursor-pointer">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 shadow-lg group-hover:scale-110 transition-transform"></div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Deployment</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
              {deploymentTrends.reduce((sum, trend) => sum + trend.total, 0)}
            </span>
          </div>
          <div className="flex items-center group cursor-pointer">
            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-3 shadow-lg group-hover:scale-110 transition-transform"></div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Maintenance</span>
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
              {maintenanceData?.dailyTrends?.reduce((sum, trend) => sum + trend.requests, 0) || 0}
            </span>
          </div>
        </div>
        
        {/* Enhanced Line Chart */}
        <div className="relative bg-white rounded-lg p-4 shadow-inner">
          <svg width={chartWidth} height={chartHeight} className="mx-auto overflow-visible">
            <defs>
              {/* Enhanced grid pattern */}
              <pattern id="modernGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f8fafc" strokeWidth="1"/>
              </pattern>
              
              {/* Gradient definitions */}
              <linearGradient id="deploymentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
              </linearGradient>
              
              <linearGradient id="maintenanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.05"/>
              </linearGradient>
              
              {/* Glow effects */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            
            {/* Background grid */}
            <rect width="100%" height="100%" fill="url(#modernGrid)" />
            
            {/* Y-axis labels with enhanced styling */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = chartHeight - padding - (ratio * (chartHeight - 2 * padding));
              const value = Math.round(maxValue * ratio);
              return (
                <g key={index}>
                  <line 
                    x1={padding - 8} 
                    y1={y} 
                    x2={chartWidth - padding} 
                    y2={y} 
                    stroke={ratio === 0 ? "#6b7280" : "#e5e7eb"} 
                    strokeWidth={ratio === 0 ? "2" : "1"}
                    strokeDasharray={ratio === 0 ? "none" : "2,2"}
                  />
                  <text 
                    x={padding - 15} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-xs fill-gray-600 font-medium"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis labels with enhanced styling */}
            {deploymentTrends.map((trend, index) => {
              const x = padding + (index * (chartWidth - 2 * padding)) / Math.max(dataPoints - 1, 1);
              return (
                <g key={index}>
                  <line 
                    x1={x} 
                    y1={chartHeight - padding} 
                    x2={x} 
                    y2={chartHeight - padding + 8} 
                    stroke="#6b7280" 
                    strokeWidth="2"
                  />
                  <text 
                    x={x} 
                    y={chartHeight - padding + 22} 
                    textAnchor="middle" 
                    className="text-xs fill-gray-600 font-medium"
                  >
                    {trend.date.split(' ')[0]}
                  </text>
                  <text 
                    x={x} 
                    y={chartHeight - padding + 35} 
                    textAnchor="middle" 
                    className="text-xs fill-gray-500"
                  >
                    {trend.date.split(' ')[1]}
                  </text>
                </g>
              );
            })}
            
            {/* Area fills with gradients */}
            <path
              d={deploymentAreaPath}
              fill="url(#deploymentGradient)"
              className="animate-pulse"
              style={{
                animation: isVisible ? 'fadeInUp 1s ease-out 0.2s both' : 'none'
              }}
            />
            
            <path
              d={maintenanceAreaPath}
              fill="url(#maintenanceGradient)"
              className="animate-pulse"
              style={{
                animation: isVisible ? 'fadeInUp 1s ease-out 0.4s both' : 'none'
              }}
            />
            
            {/* Enhanced deployment line */}
            <path
              d={deploymentPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="drop-shadow-lg"
              style={{
                strokeDasharray: isVisible ? 'none' : '1000',
                strokeDashoffset: isVisible ? '0' : '1000',
                transition: 'stroke-dashoffset 2s ease-out 0.5s'
              }}
            />
            
            {/* Enhanced maintenance line */}
            <path
              d={maintenancePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="drop-shadow-lg"
              style={{
                strokeDasharray: isVisible ? 'none' : '1000',
                strokeDashoffset: isVisible ? '0' : '1000',
                transition: 'stroke-dashoffset 2s ease-out 0.7s'
              }}
            />
            
            {/* Enhanced deployment points */}
            {deploymentPoints.map((point, index) => (
              <g key={`deploy-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="3"
                  className="hover:r-10 transition-all duration-200 cursor-pointer drop-shadow-lg"
                  filter="url(#glow)"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredPoint({
                      type: 'deployment',
                      index,
                      x: rect.left + rect.width / 2,
                      y: rect.top
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{
                    animation: isVisible ? `popIn 0.5s ease-out ${0.8 + index * 0.1}s both` : 'none'
                  }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="white"
                  className="pointer-events-none"
                />
              </g>
            ))}
            
            {/* Enhanced maintenance points */}
            {maintenancePoints.map((point, index) => (
              <g key={`maintenance-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="#f97316"
                  stroke="white"
                  strokeWidth="3"
                  className="hover:r-10 transition-all duration-200 cursor-pointer drop-shadow-lg"
                  filter="url(#glow)"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredPoint({
                      type: 'maintenance',
                      index,
                      x: rect.left + rect.width / 2,
                      y: rect.top
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{
                    animation: isVisible ? `popIn 0.5s ease-out ${1.0 + index * 0.1}s both` : 'none'
                  }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="white"
                  className="pointer-events-none"
                />
              </g>
            ))}
          </svg>
          
          {/* Enhanced Tooltip */}
          {hoveredPoint && (
            <div 
              className="fixed z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-gray-700 pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: hoveredPoint.x,
                top: hoveredPoint.y - 10
              }}
            >
              <div className="text-sm font-semibold mb-1">
                {deploymentTrends[hoveredPoint.index]?.date}
              </div>
              <div className="text-xs">
                {hoveredPoint.type === 'deployment' ? (
                  <>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Deployment: <span className="font-bold ml-1">{deploymentPoints[hoveredPoint.index]?.value}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                      Maintenance: <span className="font-bold ml-1">{maintenancePoints[hoveredPoint.index]?.value}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced data summary */}
        <div className="mt-6 grid grid-cols-7 gap-3">
          {deploymentTrends.map((trend, index) => {
            const maintenanceTrend = maintenanceData?.dailyTrends?.[index];
            const isToday = index === deploymentTrends.length - 1;
            return (
              <div 
                key={`summary-${index}`} 
                className={`text-center p-3 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer ${
                  isToday 
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{
                  animation: isVisible ? `slideInUp 0.5s ease-out ${1.2 + index * 0.1}s both` : 'none'
                }}
              >
                <div className={`font-bold text-sm mb-2 ${
                  isToday ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {trend.date.split(' ')[0]}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {trend.date.split(' ')[1]}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    <span className="text-blue-600 font-bold text-sm">{trend.total}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    <span className="text-orange-600 font-bold text-sm">{maintenanceTrend?.requests || 0}</span>
                  </div>
                </div>
                {isToday && (
                  <div className="mt-2 text-xs text-blue-600 font-semibold">
                    Hari Ini
                  </div>
                )}
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

       {/* Charts Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <TrendsChart />
         
         {/* Recent Activity Summary */}
         <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-gray-900 flex items-center">
               <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg mr-3">
                 <Activity className="h-5 w-5 text-white" />
               </div>
               Aktivitas Terkini
             </h3>
             <div className="flex items-center space-x-2 text-sm text-gray-500">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
               <span>Real-time</span>
             </div>
           </div>
           
           <div className="space-y-4">
             {/* Recent Deployments */}
             <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center space-x-2">
                   <Rocket className="h-4 w-4 text-blue-600" />
                   <span className="text-sm font-medium text-gray-700">Deployment Hari Ini</span>
                 </div>
                 <span className="text-lg font-bold text-blue-600">
                   {deploymentTrends.length > 0 ? deploymentTrends[deploymentTrends.length - 1]?.total || 0 : 0}
                 </span>
               </div>
               <div className="text-xs text-gray-500">
                 {successfulDeployments} berhasil • {failedDeployments} gagal • {pendingDeployments} pending
               </div>
             </div>
             
             {/* Recent Maintenance */}
             {maintenanceData && (
               <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-orange-200 transition-colors">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                     <Wrench className="h-4 w-4 text-orange-600" />
                     <span className="text-sm font-medium text-gray-700">Maintenance Aktif</span>
                   </div>
                   <span className="text-lg font-bold text-orange-600">
                     {maintenanceData.statusCounts.pending + maintenanceData.statusCounts.inProgress}
                   </span>
                 </div>
                 <div className="text-xs text-gray-500">
                   {maintenanceData.statusCounts.pending} pending • {maintenanceData.statusCounts.inProgress} in progress
                 </div>
               </div>
             )}
             
             {/* System Health */}
             <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-green-200 transition-colors">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center space-x-2">
                   <CheckCircle className="h-4 w-4 text-green-600" />
                   <span className="text-sm font-medium text-gray-700">System Health</span>
                 </div>
                 <span className="text-lg font-bold text-green-600">
                   {Math.round((successfulDeployments / Math.max(successfulDeployments + failedDeployments, 1)) * 100)}%
                 </span>
               </div>
               <div className="text-xs text-gray-500">
                 Success rate deployment 7 hari terakhir
               </div>
             </div>
             
             {/* Quick Actions */}
             <div className="pt-2">
               <div className="flex space-x-2">
                 <button
                   onClick={() => onNavigate("deployments")}
                   className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                 >
                   View Deployments
                 </button>
                 <button
                   onClick={() => onNavigate("maintenance")}
                   className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                 >
                   View Maintenance
                 </button>
               </div>
             </div>
           </div>
         </div>
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
