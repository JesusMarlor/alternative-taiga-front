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

export async function deleteIssue(id: number): Promise<void> {
  return apiRequest<void>(`/issues/${id}`, {
    method: 'DELETE',
  });
}

export async function getIssueByRef(
  projectId: number,
  ref: number | string
): Promise<Issue> {
  return apiRequest<Issue>(`/issues/by_ref?project=${projectId}&ref=${ref}`);
}

export async function getIssueAttachments(
  projectId: number,
  issueId: number
): Promise<import('../types/taiga').Attachment[]> {
  return apiRequest<import('../types/taiga').Attachment[]>(
    `/issues/attachments?project=${projectId}&object_id=${issueId}`
  );
}

export async function uploadIssueAttachment(
  projectId: number,
  issueId: number,
  file: File,
  description: string = ''
): Promise<import('../types/taiga').Attachment> {
  const formData = new FormData();
  formData.append('project', projectId.toString());
  formData.append('object_id', issueId.toString());
  formData.append('attached_file', file);
  if (description) {
    formData.append('description', description);
  }

  return apiRequest<import('../types/taiga').Attachment>('/issues/attachments', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteIssueAttachment(attachmentId: number): Promise<void> {
  return apiRequest<void>(`/issues/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}


