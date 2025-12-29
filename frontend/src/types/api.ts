export enum Role {
  GUEST = 'GUEST',
  SELLER = 'SELLER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  isSuperAdmin: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}


