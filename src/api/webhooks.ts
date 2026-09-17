import { apiRequest } from './client';
import { Webhook } from '../types/taiga';

export async function getWebhooks(projectId: number): Promise<Webhook[]> {
  return apiRequest<Webhook[]>(`/webhooks?project=${projectId}`);
}

export async function createWebhook(data: {
  project: number;
  name: string;
  url: string;
  key?: string;
}): Promise<Webhook> {
  return apiRequest<Webhook>('/webhooks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWebhook(
  id: number,
  data: Partial<Webhook>
): Promise<Webhook> {
  return apiRequest<Webhook>(`/webhooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteWebhook(id: number): Promise<void> {
  return apiRequest<void>(`/webhooks/${id}`, {
    method: 'DELETE',
  });
}

export async function testWebhook(id: number): Promise<any> {
  return apiRequest<any>(`/webhooks/${id}/test`, {
    method: 'POST',
  });
}
