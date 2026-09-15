import { apiRequest } from './client';
import { UserStory } from '../types/taiga';

export async function getUserStories(
  projectId: number,
  params: { milestone?: number | string; status?: number; is_closed?: boolean } = {}
): Promise<UserStory[]> {
  const query = new URLSearchParams({ project: projectId.toString() });
  if (params.milestone !== undefined) {
    if (params.milestone === null || params.milestone === 'null') {
      query.append('milestone__isnull', 'true');
    } else {
      query.append('milestone', params.milestone.toString());
    }
  }
  if (params.status !== undefined) {
    query.append('status', params.status.toString());
  }
  if (params.is_closed !== undefined) {
    query.append('is_closed', params.is_closed.toString());
  }

  return apiRequest<UserStory[]>(`/userstories?${query.toString()}`);
}

export async function getUserStory(id: number): Promise<UserStory> {
  return apiRequest<UserStory>(`/userstories/${id}`);
}

export async function updateUserStory(
  id: number,
  data: Partial<UserStory>
): Promise<UserStory> {
  return apiRequest<UserStory>(`/userstories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createUserStory(
  data: Partial<UserStory> & { project: number; subject: string }
): Promise<UserStory> {
  return apiRequest<UserStory>('/userstories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
