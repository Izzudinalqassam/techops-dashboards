import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { Deployment, CreateInput, UpdateInput, CreateDeploymentInput } from '../types';

export class DeploymentService {
  // Get all deployments
  async getDeployments(): Promise<Deployment[]> {
    return apiService.get<Deployment[]>(API_ENDPOINTS.DEPLOYMENTS);
  }

  // Get deployment by ID
  async getDeployment(id: string): Promise<Deployment> {
    return apiService.get<Deployment>(`${API_ENDPOINTS.DEPLOYMENTS}/${id}`);
  }

  // Create new deployment
  async createDeployment(deploymentData: CreateDeploymentInput): Promise<Deployment> {
    return apiService.post<Deployment>(API_ENDPOINTS.DEPLOYMENTS, deploymentData);
  }

  // Update existing deployment
  async updateDeployment(id: string, deploymentData: UpdateInput<Deployment>): Promise<Deployment> {
    return apiService.put<Deployment>(`${API_ENDPOINTS.DEPLOYMENTS}/${id}`, deploymentData);
  }

  // Delete deployment
  async deleteDeployment(id: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`${API_ENDPOINTS.DEPLOYMENTS}/${id}`);
  }

  // Get deployments by project ID
  async getDeploymentsByProject(projectId: string): Promise<Deployment[]> {
    return apiService.get<Deployment[]>(`${API_ENDPOINTS.DEPLOYMENTS}?projectId=${projectId}`);
  }

  // Get deployments by engineer ID
  async getDeploymentsByEngineer(engineerId: string): Promise<Deployment[]> {
    return apiService.get<Deployment[]>(`${API_ENDPOINTS.DEPLOYMENTS}?engineerId=${engineerId}`);
  }

  // Get deployments by status
  async getDeploymentsByStatus(status: Deployment['status']): Promise<Deployment[]> {
    return apiService.get<Deployment[]>(`${API_ENDPOINTS.DEPLOYMENTS}?status=${status}`);
  }
}

// Export singleton instance
export const deploymentService = new DeploymentService();
export default deploymentService;
