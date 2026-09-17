import { apiRequest } from './client';
import { ProjectMember } from '../types/taiga';

export async function getProjectMemberships(projectId: number): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[]>(`/memberships?project=${projectId}`);
}

export async function createMembership(data: {
  project: number;
  role: number;
  email?: string;
  username?: string;
  is_admin?: boolean;
}): Promise<ProjectMember> {
  return apiRequest<ProjectMember>('/memberships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMembership(
  id: number,
  data: { role?: number; is_admin?: boolean }
): Promise<ProjectMember> {
  return apiRequest<ProjectMember>(`/memberships/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMembership(id: number): Promise<void> {
  return apiRequest<void>(`/memberships/${id}`, {
    method: 'DELETE',
  });
}

export async function resendInvitation(id: number): Promise<any> {
  return apiRequest<any>(`/memberships/${id}/resend_invitation`, {
    method: 'POST',
  });
}
