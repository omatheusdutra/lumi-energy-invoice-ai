import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, Express, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { StartupBannerService } from './common/banner/startup-banner.service';
import { env } from './common/config/env';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { AppValidationPipe } from './common/http/validation.pipe';
import { HttpLoggingInterceptor } from './common/logging/http-logging.interceptor';
import { requestIdMiddleware } from './common/logging/request-id.middleware';
import { helmetConfig } from './common/security/helmet';

async function bootstrap(): Promise<void> {
  const silentNestBootstrapLogs = env.NODE_ENV === 'development' && env.LOG_FORMAT === 'pretty';
  const app = await NestFactory.create(AppModule, {
    bufferLogs: !silentNestBootstrapLogs,
    logger: silentNestBootstrapLogs ? false : undefined,
  });

  if (!silentNestBootstrapLogs) {
    app.useLogger(app.get(Logger));
  }

  const httpServer = app.getHttpAdapter().getInstance() as Express;
  httpServer.disable('x-powered-by');
  httpServer.set('trust proxy', env.TRUST_PROXY);
  app.use(requestIdMiddleware);

  app.use(
    json({
      limit: `${env.JSON_BODY_LIMIT_MB}mb`,
    }),
  );
  app.use(urlencoded({ extended: true, limit: `${env.URLENCODED_BODY_LIMIT_MB}mb` }));
  app.use(helmetConfig);

  app.enableCors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((item) => item.trim()),
  });

  app.useGlobalPipes(AppValidationPipe);
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.useGlobalInterceptors(app.get(HttpLoggingInterceptor));
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${env.APP_NAME} API`)
    .setDescription('API documentation')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: `${env.APP_NAME} Docs`,
    swaggerOptions: {
      displayRequestDuration: true,
      persistAuthorization: true,
    },
  });

  await app.listen(env.PORT);
  const url = await app.getUrl();
  app.get(StartupBannerService).print(url);
}

void bootstrap();
