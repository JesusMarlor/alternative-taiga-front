import { apiRequest } from './client';
import { Milestone } from '../types/taiga';

export async function getMilestones(projectId: number): Promise<Milestone[]> {
  return apiRequest<Milestone[]>(`/milestones?project=${projectId}`);
}

export async function getMilestone(id: number): Promise<Milestone> {
  return apiRequest<Milestone>(`/milestones/${id}`);
}

export async function createMilestone(
  data: Partial<Milestone> & { project: number; name: string; estimated_start: string; estimated_finish: string }
): Promise<Milestone> {
  return apiRequest<Milestone>('/milestones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMilestone(
  id: number,
  data: Partial<Milestone>
): Promise<Milestone> {
  return apiRequest<Milestone>(`/milestones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMilestone(id: number): Promise<void> {
  return apiRequest<void>(`/milestones/${id}`, {
    method: 'DELETE',
  });
}

