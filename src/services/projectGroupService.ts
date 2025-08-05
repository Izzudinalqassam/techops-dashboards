import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { ProjectGroup, CreateInput, UpdateInput } from '../types';

export class ProjectGroupService {
  // Get all project groups
  async getProjectGroups(): Promise<ProjectGroup[]> {
    return apiService.get<ProjectGroup[]>(API_ENDPOINTS.PROJECT_GROUPS);
  }

  // Get project group by ID
  async getProjectGroup(id: string): Promise<ProjectGroup> {
    return apiService.get<ProjectGroup>(`${API_ENDPOINTS.PROJECT_GROUPS}/${id}`);
  }

  // Create new project group
  async createProjectGroup(groupData: CreateInput<ProjectGroup>): Promise<ProjectGroup> {
    return apiService.post<ProjectGroup>(API_ENDPOINTS.PROJECT_GROUPS, groupData);
  }

  // Update existing project group
  async updateProjectGroup(id: string, groupData: UpdateInput<ProjectGroup>): Promise<ProjectGroup> {
    return apiService.put<ProjectGroup>(`${API_ENDPOINTS.PROJECT_GROUPS}/${id}`, groupData);
  }

  // Delete project group
  async deleteProjectGroup(id: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`${API_ENDPOINTS.PROJECT_GROUPS}/${id}`);
  }
}

// Export singleton instance
export const projectGroupService = new ProjectGroupService();
export default projectGroupService;
