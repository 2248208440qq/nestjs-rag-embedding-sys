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
  iat: number;
  exp: number;
}
