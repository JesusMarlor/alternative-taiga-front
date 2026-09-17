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

export async function deleteUserStory(id: number): Promise<void> {
  return apiRequest<void>(`/userstories/${id}`, {
    method: 'DELETE',
  });
}

export async function getUserStoryByRef(
  projectId: number,
  ref: number | string,
  extraParams: Record<string, any> = {}
): Promise<UserStory> {
  const query = new URLSearchParams({
    project: projectId.toString(),
    ref: ref.toString(),
  });
  Object.entries(extraParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      query.append(k, v.toString());
    }
  });
  return apiRequest<UserStory>(`/userstories/by_ref?${query.toString()}`);
}

export async function getUserStoryAttachments(
  projectId: number,
  storyId: number
): Promise<import('../types/taiga').Attachment[]> {
  return apiRequest<import('../types/taiga').Attachment[]>(
    `/userstories/attachments?project=${projectId}&object_id=${storyId}`
  );
}

export async function uploadUserStoryAttachment(
  projectId: number,
  storyId: number,
  file: File,
  description: string = ''
): Promise<import('../types/taiga').Attachment> {
  const formData = new FormData();
  formData.append('project', projectId.toString());
  formData.append('object_id', storyId.toString());
  formData.append('attached_file', file);
  if (description) {
    formData.append('description', description);
  }

  return apiRequest<import('../types/taiga').Attachment>('/userstories/attachments', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteUserStoryAttachment(attachmentId: number): Promise<void> {
  return apiRequest<void>(`/userstories/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}


