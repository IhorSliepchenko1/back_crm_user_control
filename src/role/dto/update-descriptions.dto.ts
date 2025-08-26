import { IsString, Length } from 'class-validator';

export class UpdateDescriptionsDto {
  @IsString()
  @Length(10, 100)
  descriptions: string;
}
