import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChangePassword {
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  oldPassword: string;
}
