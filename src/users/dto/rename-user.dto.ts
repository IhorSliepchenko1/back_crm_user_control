import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RenameUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  login: string;
}
