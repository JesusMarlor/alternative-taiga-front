import { apiRequest } from './client';
import { ProjectMember } from '../types/taiga';

export async function getProjectMemberships(projectId: number): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[]>(`/memberships?project=${projectId}`);
}

export async function createMembership(data: {
  project: number;
  role: number;
  username?: string;
  email?: string;
  is_admin?: boolean;
}): Promise<ProjectMember> {
  const userIdentifier = data.username || data.email;
  const payload: any = {
    project: data.project,
    role: data.role,
    username: userIdentifier,
    email: data.email || userIdentifier,
    is_admin: !!data.is_admin,
  };

  return apiRequest<ProjectMember>('/memberships', {
    method: 'POST',
    body: JSON.stringify(payload),
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
