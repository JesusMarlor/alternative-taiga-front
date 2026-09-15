import { apiRequest } from './client';
import { Issue } from '../types/taiga';

export async function getIssues(projectId: number): Promise<Issue[]> {
  return apiRequest<Issue[]>(`/issues?project=${projectId}`);
}

export async function updateIssue(id: number, data: Partial<Issue>): Promise<Issue> {
  return apiRequest<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createIssue(
  data: Partial<Issue> & { project: number; subject: string; priority: number; severity: number; type: number }
): Promise<Issue> {
  return apiRequest<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
