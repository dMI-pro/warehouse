import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

