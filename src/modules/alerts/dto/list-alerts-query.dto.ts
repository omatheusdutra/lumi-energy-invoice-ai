import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListAlertsQueryDto {
  @ApiPropertyOptional({ example: '3001116735', description: 'Filtro por numero do cliente' })
  @IsOptional()
  @IsString()
  numero_cliente?: string;

  @ApiPropertyOptional({ example: 'SET/2024', description: 'Filtro por mes de referencia' })
  @IsOptional()
  @Matches(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/i)
  mes_referencia?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize = 20;
}
