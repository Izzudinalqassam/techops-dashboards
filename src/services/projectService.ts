import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { Project, CreateInput, UpdateInput, ApiResponse } from '../types';

export class ProjectService {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    return apiService.get<Project[]>(API_ENDPOINTS.PROJECTS);
  }

  // Get project by ID
  async getProject(id: string): Promise<Project> {
    return apiService.get<Project>(`${API_ENDPOINTS.PROJECTS}/${id}`);
  }

  // Create new project
  async createProject(projectData: CreateInput<Project>): Promise<Project> {
    return apiService.post<Project>(API_ENDPOINTS.PROJECTS, projectData);
  }

  // Update existing project
  async updateProject(id: string, projectData: UpdateInput<Project>): Promise<Project> {
    return apiService.put<Project>(`${API_ENDPOINTS.PROJECTS}/${id}`, projectData);
  }

  // Delete project
  async deleteProject(id: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`${API_ENDPOINTS.PROJECTS}/${id}`);
  }

  // Get projects by group ID
  async getProjectsByGroup(groupId: string): Promise<Project[]> {
    return apiService.get<Project[]>(`${API_ENDPOINTS.PROJECTS}?groupId=${groupId}`);
  }

  // Get projects by engineer ID
  async getProjectsByEngineer(engineerId: string): Promise<Project[]> {
    return apiService.get<Project[]>(`${API_ENDPOINTS.PROJECTS}?engineerId=${engineerId}`);
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;
