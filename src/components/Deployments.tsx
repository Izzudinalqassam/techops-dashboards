import { useState } from "react";
import {
  Rocket,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  Code,
  Server,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ensureArray } from "../utils/arrayValidation";
import { deploymentService } from "../services/deploymentService";

interface DeploymentsProps {
  data: any;
  selectedProject?: string | null;
  onNavigate: (view: string, groupId?: string, projectId?: string) => void;
}

const Deployments: React.FC<DeploymentsProps> = ({
  data,
  selectedProject,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(
    null
  );
  const [deploymentToDelete, setDeploymentToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();



  const handleDeleteDeployment = async (deploymentId: string) => {
    try {
      setIsDeleting(true);
      await deploymentService.deleteDeployment(deploymentId);
      
      // Redirect to dashboard with success notification
      window.location.href = "/?success=deployment-deleted";
    } catch (error) {
      console.error("Error deleting deployment:", error);
      alert("Failed to delete deployment. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeploymentToDelete(null);
    }
  };

  const toggleExpanded = (deploymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDeployment(
      expandedDeployment === deploymentId ? null : deploymentId
    );
  };

  let filteredDeployments = data.deployments;

  if (selectedProject) {
    filteredDeployments = filteredDeployments.filter(
      (d: any) => d.projectId === selectedProject
    );
  }

  if (searchTerm) {
    filteredDeployments = filteredDeployments.filter((d: any) => {
      const project = data.projects.find((p: any) => p.id === d.projectId);
      return project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  if (filterStatus) {
    filteredDeployments = filteredDeployments.filter(
      (d: any) => d.status === filterStatus
    );
  }

  const selectedProjectData = selectedProject
    ? data.projects.find((p: any) => p.id === selectedProject)
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedProjectData
              ? `${selectedProjectData.name} Deployments`
              : "All Deployments"}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedProjectData
              ? `Track deployments for ${selectedProjectData.name}`
              : "Monitor all deployment activities"}
          </p>
        </div>
        <Link
          to="/add-deployment"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Deployment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="">All Status</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        {filteredDeployments
          .sort(
            (a: any, b: any) =>
              new Date(b.deployedAt).getTime() -
              new Date(a.deployedAt).getTime()
          )
          .map((deployment: any) => {
            const project = data.projects.find(
              (p: any) => p.id === deployment.projectId
            );
            const engineer = ensureArray(data.engineers).find(
              (e: any) => e.id === deployment.engineerId
            );
            const scripts = data.scripts.filter(
              (s: any) => s.deploymentId === deployment.id
            );
            // Cleaned up unused deploymentServices variable
            const isExpanded = expandedDeployment === deployment.id;

            return (
              <div
                key={deployment.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden transition hover:shadow-md`}
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/deployments/${deployment.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Rocket className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project?.name || "Unknown Project"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {project?.environment}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center text-gray-500 text-sm mb-1">
                          <User className="h-4 w-4 mr-1" />
                          {engineer?.username}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(deployment.deployedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {deployment.status === "Success" && (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        )}
                        {deployment.status === "Failed" && (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        {deployment.status === "Pending" && (
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                        )}
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            deployment.status === "Success"
                              ? "bg-green-100 text-green-800"
                              : deployment.status === "Failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {deployment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {deployment.description || "No description provided"}
                  </div>
                  {/* Services under description */}
                  {deployment.services && (
                    <div className="mt-2">
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Server className="h-3 w-3 mr-1 text-gray-400" />
                        <span>Services:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {deployment.services
                          .split(",")
                          .map((s: string) => s.trim())
                          .filter((s: string) => s.length > 0)
                          .map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200"
                            >
                              {service}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end space-x-3">
                  <Link
                    to={`/deployments/edit/${deployment.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center text-sm font-medium"
                    title="Edit deployment"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    <span>Edit Deployment</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeploymentToDelete(deployment.id);
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center text-sm font-medium"
                    title="Delete deployment"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Delete Deployment</span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Services */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Services Used
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {deployment.services ? (
                            deployment.services
                              .split(",")
                              .map((service: string) => service.trim())
                              .filter((service: string) => service.length > 0)
                              .map((service: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm"
                                >
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                  <span className="text-gray-700">
                                    {service}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No services specified
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Notes
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">
                            {deployment.description || deployment.notes || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Scripts */}
                    {scripts.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Code className="h-4 w-4 mr-2" />
                          Scripts ({scripts.length})
                        </h4>
                        <div className="space-y-3">
                          {scripts.map((script: any) => (
                            <div
                              key={script.id}
                              className="bg-white rounded-lg border border-gray-200"
                            >
                              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h5 className="font-medium text-gray-900">
                                  {script.title}
                                </h5>
                              </div>
                              <div className="p-4">
                                <pre className="text-sm text-gray-700 bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                                  <code>{script.content}</code>
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {filteredDeployments.length === 0 && (
        <div className="text-center py-12">
          <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No deployments found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus
              ? "Try adjusting your filters"
              : "Get started by creating your first deployment"}
          </p>
          <button
            onClick={() => onNavigate("add-deployment")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Add Deployment
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deploymentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this deployment? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeploymentToDelete(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deploymentToDelete &&
                  handleDeleteDeployment(deploymentToDelete)
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deployments;
