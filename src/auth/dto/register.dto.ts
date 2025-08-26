import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  login: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(15)
  password: string;

  @IsOptional()
  @IsString()
  adminCode: string;
}
