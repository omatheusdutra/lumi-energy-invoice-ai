import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

process.env.NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Lumi Portal';

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
  }
});
