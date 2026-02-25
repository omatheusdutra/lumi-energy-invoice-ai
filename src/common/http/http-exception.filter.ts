import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { env } from '../config/env';
import { log } from '../logging/logger';
import { RequestWithId } from '../logging/request-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & RequestWithId>();

    const isMulterLimitError =
      exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE';
    const status = isMulterLimitError
      ? HttpStatus.BAD_REQUEST
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = isMulterLimitError
      ? 'Invalid file: upload size limit exceeded'
      : exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : ((rawMessage as { message?: string | string[] }).message ?? 'Internal server error');

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      log({
        level: 'error',
        type: 'http_error',
        requestId: request.requestId,
        method: request.method,
        path: request.url,
        statusCode: status,
        error: exception instanceof Error ? exception.message : 'Unknown error',
        ...(env.NODE_ENV === 'development' && exception instanceof Error
          ? { stack: exception.stack }
          : {}),
      });
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
