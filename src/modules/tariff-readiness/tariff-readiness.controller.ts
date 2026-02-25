import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TariffReadinessService } from './tariff-readiness.service';
import { SimulateTariffDto } from './dto/simulate-tariff.dto';

@Controller('tariff-readiness')
@ApiTags('Tariff Readiness')
export class TariffReadinessController {
  constructor(private readonly tariffService: TariffReadinessService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Lista planos tarifarios ativos para simulacao' })
  @ApiOkResponse({ description: 'Planos tarifarios retornados com sucesso' })
  @ApiNotFoundResponse({ description: 'Feature tariff-readiness desabilitada' })
  async listPlans() {
    return this.tariffService.listPlans();
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simula custo estimado em um plano tarifario' })
  @ApiCreatedResponse({ description: 'Simulacao criada com sucesso' })
  @ApiNotFoundResponse({ description: 'Fatura/plano inexistente ou feature desabilitada' })
  async simulate(@Body() body: SimulateTariffDto) {
    return this.tariffService.simulate(body);
  }
}
