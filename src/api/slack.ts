import { apiRequest } from './client';
import { SlackHook } from '../types/taiga';

export async function getSlackHooks(projectId: number): Promise<SlackHook[]> {
  return apiRequest<SlackHook[]>(`/slack?project=${projectId}`);
}

export async function createSlackHook(data: SlackHook): Promise<SlackHook> {
  return apiRequest<SlackHook>('/slack', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSlackHook(
  id: number,
  data: Partial<SlackHook>
): Promise<SlackHook> {
  return apiRequest<SlackHook>(`/slack/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSlackHook(id: number): Promise<void> {
  return apiRequest<void>(`/slack/${id}`, {
    method: 'DELETE',
  });
}

export async function testSlackHook(id: number): Promise<any> {
  return apiRequest<any>(`/slack/${id}/test`, {
    method: 'POST',
  });
}
