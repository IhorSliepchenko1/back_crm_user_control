import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
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
}
