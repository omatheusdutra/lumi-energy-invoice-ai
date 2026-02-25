/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = (__ENV.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const numeroCliente = __ENV.NUMERO_CLIENTE ?? '3001116735';
const uploadExpectedStatus = Number(__ENV.UPLOAD_EXPECTED_STATUS ?? '400');

export const options = {
  vus: Number(__ENV.VUS ?? '5'),
  duration: __ENV.DURATION ?? '20s',
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const uploadPayload = {
    file: http.file('synthetic load test payload', 'synthetic.txt', 'text/plain'),
  };

  const uploadResponse = http.post(`${baseUrl}/invoices/upload`, uploadPayload);
  check(uploadResponse, {
    'upload status expected': (res) => res.status === uploadExpectedStatus,
  });

  const energiaResponse = http.get(
    `${baseUrl}/dashboard/energia?numero_cliente=${encodeURIComponent(numeroCliente)}`,
  );
  check(energiaResponse, {
    'dashboard energia status 200': (res) => res.status === 200,
  });

  const financeiroResponse = http.get(
    `${baseUrl}/dashboard/financeiro?numero_cliente=${encodeURIComponent(numeroCliente)}`,
  );
  check(financeiroResponse, {
    'dashboard financeiro status 200': (res) => res.status === 200,
  });

  sleep(0.2);
}
