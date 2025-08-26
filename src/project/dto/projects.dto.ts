import { IsNotEmpty, IsNumber } from 'class-validator';

export class Projects {
  @IsNotEmpty()
  projectStatus: boolean | 'all';

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}
