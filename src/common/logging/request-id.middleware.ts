import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId?: string };

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction): void {
  const headerRequestId = req.header('x-request-id');
  const pinoRequestId = (req as RequestWithId & { id?: string }).id;
  const requestId =
    headerRequestId && headerRequestId.trim().length > 0
      ? headerRequestId
      : pinoRequestId && pinoRequestId.trim().length > 0
        ? pinoRequestId
        : randomUUID();

  req.requestId = requestId;
  (req as RequestWithId & { id?: string }).id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
