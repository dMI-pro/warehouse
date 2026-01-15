export class AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    email: string;
    username: string;
    fullName: string;
    role: string;
    isSuperAdmin: boolean;
  };
}
