import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProjectGroups from "./components/ProjectGroups";
import ProjectGroupsEnhanced from "./components/ProjectGroupsEnhanced";
import EditProjectGroup from "./components/EditProjectGroup";
import Projects from "./components/Projects";
import ProjectsEnhanced from "./components/ProjectsEnhanced";
import Deployments from "./components/Deployments";
import DeploymentsEnhanced from "./components/DeploymentsEnhanced";
import AddProject from "./components/AddProject";
import EditProject from "./components/EditProject";
import AddDeployment from "./components/AddDeployment";
import DeploymentDetail from "./components/DeploymentDetail";
import EditDeployment from "./components/EditDeployment";
import Engineers from "./components/Engineers";

import { NotificationProvider } from "./contexts/NotificationContext";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import { DatabaseConnectionProvider } from "./contexts/DatabaseConnectionContext";
import DatabaseErrorBoundary from "./components/error/DatabaseErrorBoundary";
import DatabaseAwareLoader from "./components/ui/DatabaseAwareLoader";
import {
  DashboardSkeleton,
  ProjectsListSkeleton,
  DeploymentsListSkeleton,
} from "./components/ui/SkeletonLoader";
import {
  useProjects,
  useDeployments,
  useProjectGroups,
  useEngineers,
} from "./hooks";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/ProtectedRoute";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import UserProfile from "./components/auth/UserProfile";
import UserManagement from "./components/admin/UserManagement";
import Maintenance from "./components/maintenance/Maintenance";
import "./utils/configTest"; // Import to run configuration test
import "./utils/authTest"; // Import to run authentication test
import "./utils/authDiagnostic"; // Import to run authentication diagnostic
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";

// Wrapper components for route parameters
const EditProjectGroupWrapper: React.FC<{ data: any }> = ({ data }) => {
  const { id } = useParams<{ id: string }>();
  return <EditProjectGroup data={data} id={id} />;
};

const EditProjectWrapper: React.FC<{ data: any; onNavigate: any }> = ({
  data,
  onNavigate,
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <EditProject
      data={data}
      projectId={projectId || ""}
      onNavigate={onNavigate}
    />
  );
};

const EditDeploymentWrapper: React.FC<{ data: any; onNavigate: any }> = ({
  data,
  onNavigate,
}) => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  return (
    <EditDeployment
      data={data}
      deploymentId={deploymentId || ""}
      onNavigate={onNavigate}
    />
  );
};

// Component that uses the new state management
const AppContent: React.FC = () => {
  const { state: authState } = useAuth();

  const {
    fetchProjects,
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useProjects();
  const {
    fetchDeployments,
    deployments,
    loading: deploymentsLoading,
    error: deploymentsError,
  } = useDeployments();
  const {
    fetchProjectGroups,
    projectGroups,
    loading: groupsLoading,
    error: groupsError,
  } = useProjectGroups();
  const {
    fetchEngineers,
    engineers,
    loading: engineersLoading,
    error: engineersError,
  } = useEngineers();

  // Legacy data structure for backward compatibility
  const data = {
    projects,
    deployments,
    projectGroups,
    engineers, // ✅ Now populated from engineers hook
    services: [], // TODO: Implement services hook
    deploymentServices: [], // TODO: Implement deployment services hook
    scripts: [], // TODO: Implement scripts hook
  };

  const loading =
    projectsLoading || deploymentsLoading || groupsLoading || engineersLoading;
  const error =
    projectsError || deploymentsError || groupsError || engineersError;

  useEffect(() => {
    // Only fetch data if user is authenticated and not loading
    if (authState.isAuthenticated && !authState.isLoading) {
      const fetchAllData = async () => {
        try {
          await Promise.all([
            fetchProjects(),
            fetchDeployments(),
            fetchProjectGroups(),
            fetchEngineers(),
          ]);
        } catch (error) {
          // Database connection errors will be caught by the error boundary
          // Other errors will be handled by individual hooks
          console.error("Error fetching data:", error);
        }
      };

      fetchAllData();
    }
  }, [
    authState.isAuthenticated,
    authState.isLoading,
    fetchProjects,
    fetchDeployments,
    fetchProjectGroups,
    fetchEngineers,
  ]);

  const handleNavigation = (
    view: string,
    groupId?: string,
    projectId?: string
  ) => {
    // This function is kept for compatibility with components that still use it
    // but the actual navigation is now handled by React Router
    console.log("Navigation:", { view, groupId, projectId });
  };

  return (
    <DatabaseAwareLoader
      isLoading={loading}
      hasError={!!error}
      error={error}
      loadingMessage="Loading TechOps Dashboard..."
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        loading ? (
                          <DashboardSkeleton />
                        ) : (
                          <Dashboard
                            data={data}
                            onNavigate={handleNavigation}
                          />
                        )
                      }
                    />
                    <Route
                      path="/projects"
                      element={
                        projectsLoading || groupsLoading || engineersLoading ? (
                          <ProjectsListSkeleton />
                        ) : (
                          <ProjectsEnhanced
                            data={data}
                            selectedGroup={null}
                            onNavigate={handleNavigation}
                          />
                        )
                      }
                    />
                    <Route
                      path="/deployments"
                      element={
                        deploymentsLoading ||
                        projectsLoading ||
                        engineersLoading ? (
                          <DeploymentsListSkeleton />
                        ) : (
                          <DeploymentsEnhanced
                            data={data}
                            selectedProject={null}
                            onNavigate={handleNavigation}
                          />
                        )
                      }
                    />
                    <Route
                      path="/project-groups"
                      element={<ProjectGroupsEnhanced data={data} />}
                    />
                    <Route
                      path="/project-groups/new"
                      element={<EditProjectGroup data={data} />}
                    />
                    <Route
                      path="/project-groups/:id/edit"
                      element={<EditProjectGroupWrapper data={data} />}
                    />
                    <Route
                      path="/add-project"
                      element={
                        <AddProject data={data} onNavigate={handleNavigation} />
                      }
                    />
                    <Route
                      path="/projects/edit/:projectId"
                      element={
                        <EditProjectWrapper
                          data={data}
                          onNavigate={handleNavigation}
                        />
                      }
                    />
                    <Route
                      path="/add-deployment"
                      element={
                        <AddDeployment
                          data={data}
                          onNavigate={handleNavigation}
                        />
                      }
                    />
                    <Route
                      path="/deployments/edit/:deploymentId"
                      element={
                        <EditDeploymentWrapper
                          data={data}
                          onNavigate={handleNavigation}
                        />
                      }
                    />
                    <Route
                      path="/deployments/:deploymentId"
                      element={<DeploymentDetail data={data} />}
                    />
                    <Route
                      path="/engineers"
                      element={<Engineers data={data} />}
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <AdminRoute>
                          <UserManagement />
                        </AdminRoute>
                      }
                    />

                    <Route path="/maintenance/*" element={<Maintenance />} />
                    <Route path="/profile" element={<UserProfile />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </DatabaseAwareLoader>
  );
};

function App() {
  return (
    <DatabaseErrorBoundary>
      <DatabaseConnectionProvider>
        <AuthProvider>
          <AppProvider>
            <NotificationProvider>
              <Router>
                <AppContent />
              </Router>
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </DatabaseConnectionProvider>
    </DatabaseErrorBoundary>
  );
}

export default App;
