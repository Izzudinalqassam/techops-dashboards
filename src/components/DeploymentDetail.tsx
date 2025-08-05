import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket, Calendar, User, Code } from "lucide-react";
import { deploymentService } from "../services/deploymentService";
import { Deployment } from "../types";
import { ensureArray } from "../utils/arrayValidation";

interface DeploymentDetailProps {
  data: any;
}

const DeploymentDetail: React.FC<DeploymentDetailProps> = ({ data }) => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch individual deployment with scripts
  useEffect(() => {
    const fetchDeployment = async () => {
      if (!deploymentId) return;

      try {
        setLoading(true);
        setError(null);
        const deploymentData = await deploymentService.getDeployment(
          deploymentId
        );
        setDeployment(deploymentData);
      } catch (err) {
        console.error("Error fetching deployment:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch deployment"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDeployment();
  }, [deploymentId]);

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deployment details...</p>
        </div>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Deployment not found"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "The deployment you're looking for doesn't exist or may have been deleted."}
          </p>
          <button
            onClick={() => navigate("/deployments")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Deployments
          </button>
        </div>
      </div>
    );
  }

  const project = ensureArray(data.projects).find((p: any) => p.id === deployment.projectId);
  const engineer = ensureArray(data.engineers).find(
    (e: any) => e.id === deployment.engineerId
  );
  // Scripts are now part of the deployment object
  const scripts = deployment.scripts || [];
  const deploymentServices = data.deploymentServices
    .filter((ds: any) => ds.deploymentId === deployment.id)
    .map((ds: any) => data.services.find((s: any) => s.id === ds.serviceId));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        className="mb-6 flex items-center text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Deployments
      </button>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <div className="flex items-center mb-8">
          <div className="p-4 bg-purple-50 rounded-lg mr-4">
            <Rocket className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {deployment.name ||
                `Deployment #${String(deployment.id).slice(-6)}`}
            </h2>
            <p className="text-gray-600 mb-2">
              {project?.name || "Unknown Project"} • {project?.environment}
            </p>
            <div className="flex items-center text-gray-500 text-sm space-x-4">
              <span>{deployment.status}</span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(deployment.deployedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {engineer?.fullName || `${engineer?.firstName} ${engineer?.lastName}`.trim() || engineer?.username || "Unknown Engineer"}
              </span>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 text-sm">
              {deployment.description || "-"}
            </p>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Services Used</h3>
          <div className="flex flex-wrap gap-2">
            {(!deployment.services || deployment.services.trim() === "") && (
              <span className="text-sm text-gray-500">No services</span>
            )}
            {deployment.services &&
              deployment.services.trim() !== "" &&
              deployment.services
                .split(",")
                .map((service: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                  >
                    {service.trim()}
                  </span>
                ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Code className="h-4 w-4 mr-2" />
            Scripts
          </h3>
          {scripts.length === 0 && (
            <div className="text-sm text-gray-500">No scripts</div>
          )}
          <div className="space-y-4">
            {scripts.map((script: any) => (
              <div
                key={script.id}
                className="bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="px-4 py-2 border-b border-gray-200 font-medium">
                  {script.title}
                </div>
                <div className="p-4">
                  <pre className="text-xs text-gray-900 bg-gray-200 p-2 rounded-md overflow-x-auto">
                    <code>{script.content}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetail;
