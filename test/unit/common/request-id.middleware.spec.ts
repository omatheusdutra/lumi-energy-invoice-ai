import { requestIdMiddleware } from '../../../src/common/logging/request-id.middleware';

describe('requestIdMiddleware', () => {
  it('uses x-request-id header when present', () => {
    const req = {
      header: jest.fn(() => 'req-header-1'),
      id: undefined,
    } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe('req-header-1');
    expect(req.id).toBe('req-header-1');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'req-header-1');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('falls back to existing pino req.id when header is blank', () => {
    const req = {
      header: jest.fn(() => '   '),
      id: '123',
    } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe('123');
    expect(req.id).toBe('123');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', '123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a uuid when header and req.id are absent', () => {
    const req = {
      header: jest.fn(() => undefined),
      id: undefined,
    } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(typeof req.requestId).toBe('string');
    expect(req.requestId.length).toBeGreaterThan(0);
    expect(req.id).toBe(req.requestId);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
