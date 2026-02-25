import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardQueryDto } from './dashboard-query.dto';

export class KpiQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Quantidade de clientes no ranking top N' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  top_n?: number;
}
