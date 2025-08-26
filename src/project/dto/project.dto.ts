import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  name: string;
}
