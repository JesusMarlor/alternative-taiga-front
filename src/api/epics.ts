import { apiRequest } from './client';
import { Epic, WikiPage } from '../types/taiga';

export async function getEpics(projectId: number): Promise<Epic[]> {
  return apiRequest<Epic[]>(`/epics?project=${projectId}`);
}

export async function updateEpic(id: number, data: Partial<Epic>): Promise<Epic> {
  return apiRequest<Epic>(`/epics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createEpic(
  data: Partial<Epic> & { project: number; subject: string; color: string }
): Promise<Epic> {
  return apiRequest<Epic>('/epics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getWikiPages(projectId: number): Promise<WikiPage[]> {
  return apiRequest<WikiPage[]>(`/wiki?project=${projectId}`);
}

export async function getWikiPageBySlug(projectId: number, slug: string): Promise<WikiPage> {
  return apiRequest<WikiPage>(`/wiki/by_slug?project=${projectId}&slug=${encodeURIComponent(slug)}`);
}
