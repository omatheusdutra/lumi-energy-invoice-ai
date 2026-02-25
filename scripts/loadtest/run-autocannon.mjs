import { spawnSync } from 'node:child_process';

const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const connections = process.env.AUTOCANNON_CONNECTIONS ?? '20';
const duration = process.env.AUTOCANNON_DURATION ?? '20';
const numeroCliente = process.env.NUMERO_CLIENTE ?? '3001116735';

function runAutocannon(args) {
  const result = spawnSync('npx', ['autocannon', ...args], { stdio: 'inherit' });
  return result.status ?? 1;
}

const uploadStatus = runAutocannon([
  '-m',
  'POST',
  '-c',
  connections,
  '-d',
  duration,
  '-H',
  'content-type=application/json',
  '-b',
  '{}',
  `${baseUrl}/invoices/upload`,
]);
if (uploadStatus !== 0) {
  process.exit(uploadStatus);
}

const energiaStatus = runAutocannon([
  '-m',
  'GET',
  '-c',
  connections,
  '-d',
  duration,
  `${baseUrl}/dashboard/energia?numero_cliente=${encodeURIComponent(numeroCliente)}`,
]);
if (energiaStatus !== 0) {
  process.exit(energiaStatus);
}

const financeiroStatus = runAutocannon([
  '-m',
  'GET',
  '-c',
  connections,
  '-d',
  duration,
  `${baseUrl}/dashboard/financeiro?numero_cliente=${encodeURIComponent(numeroCliente)}`,
]);

process.exit(financeiroStatus);
