import { apiRequest } from './client';
import { User } from '../types/taiga';

export async function updateUser(id: number, data: Partial<Pick<User, 'full_name' | 'bio'>>): Promise<User> {
  return apiRequest<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword: string, password: string): Promise<void> {
  return apiRequest<void>('/users/change_password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, password }),
  });
}

export async function changeAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiRequest<User>('/users/change_avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function removeAvatar(): Promise<User> {
  return apiRequest<User>('/users/remove_avatar', { method: 'POST' });
}
