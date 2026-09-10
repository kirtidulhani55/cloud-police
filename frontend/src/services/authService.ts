import { publicRuntimeConfig } from './runtimeConfig';

const AUTH_STORAGE_KEY = 'cloud_police_reviewer_session_v1';

const IDENTITY_PLATFORM_API_KEY = publicRuntimeConfig(
  'VITE_IDENTITY_PLATFORM_API_KEY'
);

const DEFAULT_DASHBOARD_API_URL =
  'https://cloud-police-dashboard-api-794315906908.us-east1.run.app';

const DASHBOARD_API_URL = publicRuntimeConfig(
  'VITE_CLOUD_POLICE_API_URL',
  DEFAULT_DASHBOARD_API_URL
).replace(/\/$/, '');

export type AccessRole = 'OPERATOR' | 'APPROVER' | 'ADMIN';

const isAccessRole = (value: unknown): value is AccessRole =>
  value === 'OPERATOR' || value === 'APPROVER' || value === 'ADMIN';

export interface ReviewerSession {
  displayName?: string;
  email: string;
  localId: string;
  role: AccessRole;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface IdentityPlatformSignInResponse {
  displayName?: string;
  email: string;
  expiresIn: string;
  idToken: string;
  localId: string;
  refreshToken: string;
}

interface IdentityPlatformErrorResponse {
  error?: {
    message?: string;
  };
}

interface AccessSessionResponse {
  status: string;
  user?: {
    email?: string;
    role?: string;
  };
  message?: string;
}

interface IdentityPlatformRefreshResponse {
  id_token: string;
  expires_in: string;
  refresh_token: string;
  user_id: string;
}

interface IdentityPlatformAccount {
  localId?: string;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

interface IdentityPlatformLookupResponse extends IdentityPlatformErrorResponse {
  users?: IdentityPlatformAccount[];
}

interface IdentityPlatformUpdateResponse extends IdentityPlatformErrorResponse {
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
}

export interface CurrentUserProfile {
  localId: string;
  displayName: string;
  email: string;
  role: AccessRole;
  emailVerified: boolean;
  disabled: boolean;
  createdAt?: number;
  lastLoginAt?: number;
}

export class ReviewerAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewerAuthenticationError';
  }
}

export const isReviewerLoginConfigured = () =>
  Boolean(IDENTITY_PLATFORM_API_KEY);

export const loadReviewerSession = (): ReviewerSession | null => {
  try {
    const rawSession = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession) as ReviewerSession;
    if (
      !session.idToken ||
      !session.refreshToken ||
      !session.email ||
      !session.localId ||
      !isAccessRole(session.role)
    ) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

const saveReviewerSession = (session: ReviewerSession) => {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

const friendlyAuthError = (errorCode: string) => {
  if (
    errorCode.includes('INVALID_LOGIN_CREDENTIALS') ||
    errorCode.includes('EMAIL_NOT_FOUND') ||
    errorCode.includes('INVALID_PASSWORD')
  ) {
    return 'The email or password is incorrect.';
  }
  if (errorCode.includes('USER_DISABLED')) {
    return 'This reviewer account has been disabled by the administrator.';
  }
  if (errorCode.includes('TOO_MANY_ATTEMPTS')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return 'Sign-in could not be completed. Please try again.';
};

const verifyAccessRole = async (idToken: string): Promise<AccessRole> => {
  let response: Response;

  try {
    response = await fetch(`${DASHBOARD_API_URL}/api/session`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
  } catch {
    throw new ReviewerAuthenticationError(
      'The authorization service is unavailable. Please try again.'
    );
  }

  const payload = (await response.json().catch(() => ({}))) as AccessSessionResponse;

  if (response.status === 403) {
    throw new ReviewerAuthenticationError(
      'Access denied. This account has not been assigned a Cloud Police role.'
    );
  }

  if (response.status === 401) {
    throw new ReviewerAuthenticationError(
      'Your sign-in could not be verified. Please sign in again.'
    );
  }

  const role = payload.user?.role;
  if (!response.ok || !isAccessRole(role)) {
    throw new ReviewerAuthenticationError(
      payload.message || 'Cloud Police could not verify this account.'
    );
  }

  return role;
};

export const signInReviewer = async (
  email: string,
  password: string
): Promise<ReviewerSession> => {
  if (!IDENTITY_PLATFORM_API_KEY) {
    throw new Error(
      'Sign-in is temporarily unavailable. Please contact the Cloud Police administrator.'
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(
      IDENTITY_PLATFORM_API_KEY
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true,
      }),
    }
  );

  const payload = (await response.json()) as
    | IdentityPlatformSignInResponse
    | IdentityPlatformErrorResponse;

  if (!response.ok || !('idToken' in payload)) {
    const errorCode =
      'error' in payload ? payload.error?.message || 'UNKNOWN' : 'UNKNOWN';
    throw new Error(friendlyAuthError(errorCode));
  }

  const session: ReviewerSession = {
    displayName: payload.displayName?.trim() || undefined,
    email: payload.email,
    localId: payload.localId,
    role: await verifyAccessRole(payload.idToken),
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    expiresAt: Date.now() + Number(payload.expiresIn || 3600) * 1000,
  };

  saveReviewerSession(session);
  return session;
};

export const sendPasswordResetEmail = async (
  email: string
): Promise<void> => {
  requireIdentityPlatformConfiguration();

  let response: Response;

  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(
        IDENTITY_PLATFORM_API_KEY
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: email.trim(),
        }),
      }
    );
  } catch {
    throw new ReviewerAuthenticationError(
      'The password-reset service is unavailable. Please try again.'
    );
  }

  const payload = (await response.json().catch(() => ({}))) as
    IdentityPlatformErrorResponse;
  const errorCode = payload.error?.message || '';

  // Do not reveal whether an email address belongs to an account.
  if (response.ok || errorCode.includes('EMAIL_NOT_FOUND')) {
    return;
  }

  if (errorCode.includes('INVALID_EMAIL')) {
    throw new ReviewerAuthenticationError(
      'Enter a valid work email address.'
    );
  }

  if (errorCode.includes('TOO_MANY_ATTEMPTS')) {
    throw new ReviewerAuthenticationError(
      'Too many requests. Please wait a moment and try again.'
    );
  }

  throw new ReviewerAuthenticationError(
    'The password-reset email could not be sent. Please try again.'
  );
};

export const getReviewerIdToken = async (): Promise<string> => {
  const session = loadReviewerSession();

  if (!session) {
    throw new ReviewerAuthenticationError(
      'Your reviewer session has ended. Please sign in again.'
    );
  }

  if (session.expiresAt > Date.now() + 60_000) {
    return session.idToken;
  }

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(
      IDENTITY_PLATFORM_API_KEY
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
      }),
    }
  );

  const payload = (await response.json()) as
    | IdentityPlatformRefreshResponse
    | IdentityPlatformErrorResponse;

  if (!response.ok || !('id_token' in payload)) {
    signOutReviewer();
    throw new ReviewerAuthenticationError(
      'Your reviewer session has expired. Please sign in again.'
    );
  }

  const refreshedSession: ReviewerSession = {
    ...session,
    localId: payload.user_id || session.localId,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token || session.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };

  saveReviewerSession(refreshedSession);
  return refreshedSession.idToken;
};

const requireIdentityPlatformConfiguration = () => {
  if (!IDENTITY_PLATFORM_API_KEY) {
    throw new ReviewerAuthenticationError(
      'Identity Platform is not configured for this website.'
    );
  }
};

export const loadCurrentUserProfile = async (): Promise<CurrentUserProfile> => {
  requireIdentityPlatformConfiguration();

  const session = loadReviewerSession();
  if (!session) {
    throw new ReviewerAuthenticationError(
      'Your session has ended. Please sign in again.'
    );
  }

  const idToken = await getReviewerIdToken();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
      IDENTITY_PLATFORM_API_KEY
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  const payload = (await response.json()) as IdentityPlatformLookupResponse;
  const account = payload.users?.[0];

  if (!response.ok || !account) {
    throw new ReviewerAuthenticationError(
      payload.error?.message || 'Cloud Police could not load your account.'
    );
  }

  return {
    localId: account.localId || session.localId,
    displayName:
      account.displayName?.trim() ||
      session.displayName ||
      session.email,
    email: account.email || session.email,
    role: session.role,
    emailVerified: Boolean(account.emailVerified),
    disabled: Boolean(account.disabled),
    createdAt: account.createdAt ? Number(account.createdAt) : undefined,
    lastLoginAt: account.lastLoginAt ? Number(account.lastLoginAt) : undefined,
  };
};

export const sendCurrentUserVerificationEmail = async (): Promise<void> => {
  requireIdentityPlatformConfiguration();
  const idToken = await getReviewerIdToken();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(
      IDENTITY_PLATFORM_API_KEY
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken }),
    }
  );
  const payload = (await response.json()) as IdentityPlatformErrorResponse;

  if (!response.ok) {
    const errorCode = payload.error?.message || '';
    if (errorCode.includes('TOO_MANY_ATTEMPTS')) {
      throw new ReviewerAuthenticationError(
        'A verification email was sent recently. Please wait before requesting another one.'
      );
    }
    if (errorCode.includes('TOKEN_EXPIRED') || errorCode.includes('INVALID_ID_TOKEN')) {
      throw new ReviewerAuthenticationError(
        'Your session has expired. Please sign in again before requesting verification.'
      );
    }
    throw new ReviewerAuthenticationError(
      'The verification email could not be sent. Please try again later.'
    );
  }
};

export const changeCurrentUserPassword = async (
  password: string
): Promise<void> => {
  requireIdentityPlatformConfiguration();

  const session = loadReviewerSession();
  if (!session) {
    throw new ReviewerAuthenticationError(
      'Your session has ended. Please sign in again.'
    );
  }

  const idToken = await getReviewerIdToken();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(
      IDENTITY_PLATFORM_API_KEY
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, password, returnSecureToken: true }),
    }
  );
  const payload = (await response.json()) as IdentityPlatformUpdateResponse;

  if (!response.ok) {
    throw new ReviewerAuthenticationError(
      payload.error?.message || 'Your password could not be changed.'
    );
  }

  if (payload.idToken && payload.refreshToken) {
    saveReviewerSession({
      ...session,
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
      expiresAt:
        Date.now() + Number(payload.expiresIn || 3600) * 1000,
    });
  }
};

export const signOutReviewer = () => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // The in-memory session will still be cleared by the application.
  }
};
