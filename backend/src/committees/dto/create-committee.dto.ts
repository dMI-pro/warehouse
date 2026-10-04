import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCommitteeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  contactInfo?: string;
}
