import { apiRequest } from './client';
import { Project, ProjectMember } from '../types/taiga';

export async function getProjects(memberId?: number): Promise<Project[]> {
  const member = memberId ? `&member=${memberId}` : '';
  return apiRequest<Project[]>(`/projects?order_by=user_order${member}`);
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

export async function getProjectTemplates(): Promise<{ id: number; name: string; slug: string; description: string }[]> {
  return apiRequest('/project-templates');
}

export async function createProject(data: {
  name: string;
  description: string;
  creation_template: number;
  is_private: boolean;
}): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
