import { apiRequest } from './client';
import { HistoryEntry } from '../types/taiga';

export type HistoryContentType = 'userstory' | 'issue' | 'task' | 'epic';

export async function getHistory(
  contentType: HistoryContentType,
  objectId: number,
  type: 'comment' | 'activity'
): Promise<HistoryEntry[]> {
  return apiRequest<HistoryEntry[]>(`/history/${contentType}/${objectId}?type=${type}`);
}

export async function deleteComment(
  contentType: HistoryContentType,
  objectId: number,
  entryId: string
): Promise<void> {
  return apiRequest<void>(`/history/${contentType}/${objectId}/delete_comment?id=${entryId}`, {
    method: 'POST',
  });
}
