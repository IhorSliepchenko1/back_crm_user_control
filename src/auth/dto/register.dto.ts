import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  login: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  password: string;

  @IsOptional()
  @IsString()
  adminCode: string;
}
