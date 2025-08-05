import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  FolderTree,
  Server,
  Rocket,
  User,
  LogOut,
  Settings,
  Shield,
  Wrench,
  Menu,
  X,
  Database,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import StatusBadge from "./ui/StatusBadge";
import ConfirmationModal from "./ui/ConfirmationModal";

interface SidebarProps {
  currentView?: string;
  onNavigate?: (view: string, groupId?: string) => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const [activeView, setActiveView] = useState("dashboard");
  const { state, logout } = useAuth();
  const { showSuccess, showError } = useNotification();

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showSuccess("Successfully logged out");
      setShowLogoutConfirmation(false);
    } catch (error) {
      showError("Logout failed");
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  useEffect(() => {
    // Ambil path dari URL (tanpa slash di depan)
    const path = location.pathname.substring(1) || "dashboard";

    // Tentukan view aktif berdasarkan path
    if (path.startsWith("deployments/")) {
      setActiveView("deployments");
    } else if (
      path === "add-project" ||
      path === "add-deployment" ||
      path === "project-groups"
    ) {
      // Tetap di view saat ini jika sedang di form
      setActiveView(path);
    } else {
      setActiveView(path || "dashboard");
    }
  }, [location]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["groups"]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get initial state from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Save to localStorage
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newCollapsed));
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "project-groups", label: "Project Groups", icon: FolderTree },
    { id: "projects", label: "All Projects", icon: Server },
    { id: "deployments", label: "Deployments", icon: Rocket },
  ];

  // Removed action items as per user request

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white border-r border-gray-200 shadow-sm transition-all duration-300`}
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className={`${isCollapsed ? "hidden" : "block"}`}>
          <h1 className="text-xl font-bold text-gray-900">
            Deployment Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">TechOps Admin Panel</p>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={`/${item.id === "dashboard" ? "" : item.id}`}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "px-3"
              } py-2 text-left text-sm font-medium rounded-lg transition-colors ${
                activeView === item.id ||
                (item.id === "dashboard" && activeView === "") ||
                (item.id === "deployments" &&
                  activeView.startsWith("deployments"))
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && item.label}
            </Link>
          );
        })}

        {/* Maintenance Requests - Visible to all users */}
        <Link
          to="/maintenance"
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center px-2" : "px-3"
          } py-2 text-left text-sm font-medium rounded-lg transition-colors ${
            activeView === "maintenance" ||
            location.pathname.startsWith("/maintenance")
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          title={isCollapsed ? "Maintenance Requests" : undefined}
        >
          <Wrench className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && "Maintenance Requests"}
        </Link>

        {/* Admin Section - Only visible to admin users */}
        {state.user?.role === "Admin" && (
          <>
            {!isCollapsed && (
              <div className="px-3 py-2 mt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </h3>
              </div>
            )}
            <Link
              to="/admin/users"
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "px-3"
              } py-2 text-left text-sm font-medium rounded-lg transition-colors ${
                activeView === "admin/users" ||
                location.pathname === "/admin/users"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={isCollapsed ? "User Management" : undefined}
            >
              <Shield className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "User Management"}
            </Link>
          </>
        )}
      </nav>

      {/* User Section */}
      {state.user && (
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div
            className={`px-3 mb-3 ${isCollapsed ? "flex justify-center" : ""}`}
          >
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "space-x-3"
              } p-3 bg-gray-50 rounded-lg ${isCollapsed ? "w-10 h-10" : ""}`}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {state.user.firstName} {state.user.lastName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <StatusBadge
                      status={
                        state.user.role === "Admin"
                          ? "Admin"
                          : state.user.role === "User"
                          ? "User"
                          : "User"
                      }
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-3 space-y-1">
            <Link
              to="/profile"
              className={`flex items-center ${
                isCollapsed ? "justify-center px-2" : "px-3"
              } py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === "profile"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={isCollapsed ? "Profile" : undefined}
            >
              <Settings className={`h-4 w-4 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "Profile"}
            </Link>

            <button
              onClick={handleLogoutClick}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "px-3"
              } py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className={`h-4 w-4 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "Logout"}
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to sign in again to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        variant="info"
        isLoading={isLoggingOut}
      />
    </div>
  );
};

export default Sidebar;
