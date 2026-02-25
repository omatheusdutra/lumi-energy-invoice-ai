import { ApiProperty } from '@nestjs/swagger';

export class UploadInvoiceDto {
  // Multipart upload uses `file` field handled by interceptor.
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo PDF da fatura de energia',
  })
  declare file: Express.Multer.File;
}
