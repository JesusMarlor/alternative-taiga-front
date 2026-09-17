import { apiRequest } from './client';

export interface InvitationDetails {
  id: number;
  project: number;
  project_name: string;
  project_slug: string;
  role: number;
  role_name: string;
  email: string;
  user?: number | null;
  invited_by: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
    big_photo?: string | null;
    gravatar_id?: string;
  };
  token: string;
}

export async function getInvitationByToken(token: string): Promise<InvitationDetails> {
  return apiRequest<InvitationDetails>(`/invitations/${token}`);
}
