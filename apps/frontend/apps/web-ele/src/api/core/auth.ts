import { baseRequestClient, requestClient } from '#/api/request';

type RawResponse<T> = {
  data: T;
};

export namespace AuthApi {
  /** Login request parameters. */
  export interface LoginParams {
    captcha?: boolean;
    password?: string;
    username?: string;
  }

  /** Login response payload. */
  export interface LoginResult {
    accessToken: string;
  }

  /** Raw refresh-token response wrapped by the backend response format. */
  export interface RefreshTokenRawResponse {
    code: number;
    data: { accessToken: string };
    message: string;
  }
}

/**
 * Login.
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data, {
    skipReAuthenticate: true,
  });
}

/**
 * Refresh access token.
 *
 * Use baseRequestClient to avoid recursive authenticateResponseInterceptor calls.
 * The backend sends refreshToken through an httpOnly cookie.
 */
export async function refreshTokenApi(): Promise<string> {
  const resp = await baseRequestClient.post<
    RawResponse<AuthApi.RefreshTokenRawResponse>
  >('/auth/refresh', { withCredentials: true });

  // baseRequestClient returns a raw response, so resp.data is the response body.
  return resp.data.data.accessToken;
}

/**
 * Logout.
 *
 * Use requestClient so the Authorization header is included when present.
 */
export async function logoutApi() {
  return requestClient.post(
    '/auth/logout',
    {},
    {
      skipReAuthenticate: true,
      withCredentials: true,
    },
  );
}

/**
 * Get current user access codes.
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
