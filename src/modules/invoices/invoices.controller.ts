import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { env } from '../../common/config/env';
import { RequestWithId } from '../../common/logging/request-id.middleware';
import { isPdfMimeType } from '../../common/security/upload.validation';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller()
@ApiTags('Invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('invoices/upload')
  @ApiOperation({ summary: 'Upload e processamento de fatura PDF via LLM multimodal' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadInvoiceDto })
  @ApiCreatedResponse({ description: 'Fatura processada e persistida com sucesso' })
  @ApiBadRequestResponse({ description: 'Arquivo invalido, ausente ou nao-PDF' })
  @ApiUnprocessableEntityResponse({
    description: 'LLM retornou JSON invalido/incompleto para o schema exigido',
  })
  @ApiBadGatewayResponse({ description: 'Falha no provedor LLM' })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: env.UPLOAD_MAX_MB * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!isPdfMimeType(file.mimetype)) {
          cb(new BadRequestException('Invalid file: only PDF is allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadInvoice(@UploadedFile() file: Express.Multer.File, @Req() request: RequestWithId) {
    if (!file) {
      throw new BadRequestException('File is required in field: file');
    }

    return this.invoicesService.processUpload(file, request);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Listagem paginada de faturas com filtros' })
  @ApiOkResponse({ description: 'Lista de faturas retornada com sucesso' })
  @ApiBadRequestResponse({ description: 'Parametros de filtro/paginacao invalidos' })
  async listInvoices(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.listInvoices(query);
  }
}
