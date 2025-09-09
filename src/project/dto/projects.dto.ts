import { IsNotEmpty, IsNumber } from 'class-validator';

export class Projects {
  @IsNotEmpty()
  active: boolean;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}
