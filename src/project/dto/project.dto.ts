import { IsArray, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class ProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  participants: string[];
}
