import { NextRequest, NextResponse } from 'next/server';

function buildCsp(nonce: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const connectSources = ["'self'", 'http:', 'https:'];

  if (!isProduction) {
    // Required for Next HMR/websocket during local development.
    connectSources.push('ws:', 'wss:');
  }

  if (apiBaseUrl) {
    try {
      const apiOrigin = new URL(apiBaseUrl).origin;
      if (!connectSources.includes(apiOrigin)) {
        connectSources.push(apiOrigin);
      }
    } catch {
      // Ignore malformed env and keep safe defaults.
    }
  }

  const scriptSources = isProduction
    ? ["'self'", `'nonce-${nonce}'`]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
  const styleSources = isProduction
    ? ["'self'", `'nonce-${nonce}'`]
    : ["'self'", "'unsafe-inline'"];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ];

  if (isProduction) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
