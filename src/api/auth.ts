import { apiRequest } from './client';
import { AuthResponse, User } from '../types/taiga';

export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth', {
    method: 'POST',
    body: JSON.stringify({
      type: 'normal',
      username,
      password,
    }),
  });
}

export async function getMeApi(): Promise<User> {
  return apiRequest<User>('/users/me');
}

export async function refreshApi(refresh: string): Promise<{ auth_token: string; refresh: string }> {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });
}
