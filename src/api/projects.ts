import { apiRequest } from './client';
import { Project, ProjectMember } from '../types/taiga';

export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/projects?order_by=user_order');
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  return apiRequest<Project>(`/projects/by_slug?slug=${encodeURIComponent(slug)}`);
}

export async function getProjectMemberships(projectId: number): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[]>(`/memberships?project=${projectId}`);
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
