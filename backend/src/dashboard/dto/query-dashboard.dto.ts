import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDashboardDto {
  @IsInt()
  @Min(7)
  @Max(90)
  @Type(() => Number)
  @IsOptional()
  chartDays?: number = 30;
}
