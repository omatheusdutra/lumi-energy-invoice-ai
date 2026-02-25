import { ValidationPipe } from '@nestjs/common';
import { env } from '../config/env';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  disableErrorMessages: env.NODE_ENV === 'production',
  validationError: {
    target: false,
    value: false,
  },
  transformOptions: {
    enableImplicitConversion: true,
  },
});
