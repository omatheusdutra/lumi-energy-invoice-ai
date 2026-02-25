import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { HttpMethod, recordHttpRequest } from '../metrics/metrics.registry';
import { log } from './logger';
import { RequestWithId } from './request-id.middleware';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & RequestWithId>();
    const res = http.getResponse<Response>();
    const start = Date.now();
    const method = this.resolveMethod(req.method);

    res.once('finish', () => {
      const durationMs = Date.now() - start;
      const route = this.resolveRoute(req);
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      recordHttpRequest(method, route, res.statusCode, durationMs);
      log({
        level,
        type: 'http_access',
        requestId: req.requestId ?? (req as Request & { id?: string }).id,
        method,
        route,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    });

    return next.handle();
  }

  private resolveMethod(method: string | undefined): HttpMethod {
    const normalized = (method ?? '').toUpperCase();
    if (
      normalized === 'GET' ||
      normalized === 'POST' ||
      normalized === 'PUT' ||
      normalized === 'PATCH' ||
      normalized === 'DELETE' ||
      normalized === 'OPTIONS' ||
      normalized === 'HEAD'
    ) {
      return normalized;
    }
    return 'OTHER';
  }

  private resolveRoute(req: Request): string {
    const routePath =
      req.route && typeof req.route.path === 'string'
        ? `${req.baseUrl ?? ''}${req.route.path}`
        : req.path || req.originalUrl.split('?')[0] || 'unknown';

    return routePath
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:uuid')
      .replace(/\/\d+(?=\/|$)/g, '/:id');
  }
}
