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

export async function loginWithInvitationApi(
  username: string,
  password: string,
  invitationToken: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth', {
    method: 'POST',
    body: JSON.stringify({
      type: 'normal',
      username,
      password,
      invitation_token: invitationToken,
    }),
  });
}

export async function registerWithInvitationApi(data: {
  token: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      type: 'private',
      token: data.token,
      full_name: data.fullName,
      username: data.username,
      email: data.email,
      password: data.password,
      accepted_terms: true,
    }),
  });
}

