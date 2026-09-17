import { apiRequest } from './client';
import { Task } from '../types/taiga';

export async function getTasks(projectId: number, milestoneId?: number): Promise<Task[]> {
  const query = new URLSearchParams({ project: projectId.toString() });
  if (milestoneId) query.append('milestone', milestoneId.toString());
  return apiRequest<Task[]>(`/tasks?${query.toString()}`);
}

export async function updateTask(id: number, data: Partial<Task>): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createTask(
  data: Partial<Task> & { project: number; subject: string; user_story?: number }
): Promise<Task> {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTasksByStory(
  projectId: number,
  storyId: number
): Promise<Task[]> {
  return apiRequest<Task[]>(
    `/tasks?order_by=us_order&project=${projectId}&user_story=${storyId}`
  );
}

export async function deleteTask(id: number): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

