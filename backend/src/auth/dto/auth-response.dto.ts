export class AuthUserDto {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  isSuperAdmin: boolean;
}

export class AuthResponseDto {
  user: AuthUserDto;
}
