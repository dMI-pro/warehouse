import { IsEmail, IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, IsEnum, IsInt } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsInt()
  @IsOptional()
  userStatusId?: number;
}
