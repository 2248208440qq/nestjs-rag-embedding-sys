export interface UserInfo {
  id: string;
  username: string;
  realName: string | null;
  roles: string[];
  homePath?: string;
  avatar?: string;
}

export interface LoginResult {
  accessToken: string;
  userInfo: UserInfo;
}

export interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  realName: string | null;
  homePath?: string;
  avatar?: string;
  iat: number;
  exp: number;
}
