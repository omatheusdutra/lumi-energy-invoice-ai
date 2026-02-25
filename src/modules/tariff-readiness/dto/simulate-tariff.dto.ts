import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SimulateTariffDto {
  @ApiProperty({ format: 'uuid', example: 'c56a4180-65aa-42ec-a945-5fd21dec0538' })
  @IsUUID()
  invoice_id!: string;

  @ApiProperty({ format: 'uuid', example: 'c56a4180-65aa-42ec-a945-5fd21dec0539' })
  @IsUUID()
  tariff_plan_id!: string;
}
