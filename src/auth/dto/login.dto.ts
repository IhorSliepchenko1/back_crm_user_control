import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  login: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  password: string;

  @IsOptional()
  remember: boolean;
}
