import {
  AccessRole,
  getReviewerIdToken,
} from './authService';
import { publicRuntimeConfig } from './runtimeConfig';


const DEFAULT_APPROVAL_API_URL =
  'https://cloud-police-approval-api-794315906908.us-east1.run.app';

const APPROVAL_API_URL = publicRuntimeConfig(
  'VITE_CLOUD_POLICE_APPROVAL_API_URL',
  DEFAULT_APPROVAL_API_URL
).replace(/\/$/, '');


export interface ManagedUser {
  user_id: string;
  email: string;
  display_name: string | null;
  role: AccessRole | null;
  disabled: boolean;
  email_verified: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
}

export interface CreateManagedUserInput {
  email: string;
  temporaryPassword: string;
  role: AccessRole;
  displayName?: string;
  reason?: string;
}

export interface UpdateManagedUserInput {
  role?: AccessRole;
  disabled?: boolean;
  displayName?: string;
  reason: string;
}

interface AdminApiResponse {
  status?: string;
  message?: string;
  users?: ManagedUser[];
  user?: ManagedUser;
  audit_id?: string;
}


export class AdminApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AdminApiError';
    this.statusCode = statusCode;
  }
}


const adminRequest = async (
  path: string,
  options: RequestInit = {}
): Promise<AdminApiResponse> => {
  const idToken = await getReviewerIdToken();
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${idToken}`);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${APPROVAL_API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new AdminApiError(
      'The Admin service is unavailable. Please try again.',
      0
    );
  }

  const payload = (
    await response.json().catch(() => ({}))
  ) as AdminApiResponse;

  if (response.status === 401) {
    throw new AdminApiError(
      'Your session has expired. Please sign in again.',
      401
    );
  }

  if (response.status === 403) {
    throw new AdminApiError(
      'Admin permission is required.',
      403
    );
  }

  if (!response.ok) {
    throw new AdminApiError(
      payload.message || 'The Admin request could not be completed.',
      response.status
    );
  }

  return payload;
};


export const listManagedUsers = async (): Promise<ManagedUser[]> => {
  const payload = await adminRequest('/api/admin/users');
  return payload.users || [];
};


export const createManagedUser = async (
  input: CreateManagedUserInput
): Promise<ManagedUser> => {
  const payload = await adminRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      temporary_password: input.temporaryPassword,
      role: input.role,
      display_name: input.displayName?.trim() || null,
      reason: input.reason?.trim() || 'User account created.',
    }),
  });

  if (!payload.user) {
    throw new AdminApiError(
      'The Admin service returned an incomplete user record.',
      500
    );
  }

  return payload.user;
};


export const updateManagedUser = async (
  userId: string,
  input: UpdateManagedUserInput
): Promise<ManagedUser> => {
  const body: Record<string, unknown> = {
    reason: input.reason.trim(),
  };

  if (input.role !== undefined) {
    body.role = input.role;
  }

  if (input.disabled !== undefined) {
    body.disabled = input.disabled;
  }

  if (input.displayName !== undefined) {
    body.display_name = input.displayName.trim();
  }

  const payload = await adminRequest(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  );

  if (!payload.user) {
    throw new AdminApiError(
      'The Admin service returned an incomplete user record.',
      500
    );
  }

  return payload.user;
};
