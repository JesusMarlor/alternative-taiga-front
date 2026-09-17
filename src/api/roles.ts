import { apiRequest } from './client';
import { RoleItem } from '../types/taiga';

export async function getRoles(projectId: number): Promise<RoleItem[]> {
  return apiRequest<RoleItem[]>(`/roles?project=${projectId}&order_by=order`);
}

export async function createRole(data: {
  project: number;
  name: string;
  permissions?: string[];
  computable?: boolean;
}): Promise<RoleItem> {
  return apiRequest<RoleItem>('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(
  id: number,
  data: Partial<RoleItem>
): Promise<RoleItem> {
  return apiRequest<RoleItem>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRole(id: number): Promise<void> {
  return apiRequest<void>(`/roles/${id}`, {
    method: 'DELETE',
  });
}
