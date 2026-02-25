import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

function toDockerPath(inputPath) {
  if (process.platform !== 'win32') {
    return inputPath;
  }

  const normalized = inputPath.replace(/\\/g, '/');
  const driveLetter = normalized[0]?.toLowerCase();
  if (!driveLetter || normalized[1] !== ':') {
    return normalized;
  }

  return `/${driveLetter}${normalized.slice(2)}`;
}

const dockerCheck = spawnSync('docker', ['version'], { stdio: 'ignore' });
if (dockerCheck.status !== 0) {
  process.stderr.write('[loadtest:k6] docker is required (Docker Desktop or Docker Engine)\n');
  process.exit(1);
}

const workspacePath = resolve(process.cwd());
const dockerWorkspacePath = toDockerPath(workspacePath);

const envPairs = [
  ['BASE_URL', process.env.BASE_URL ?? 'http://localhost:3000'],
  ['NUMERO_CLIENTE', process.env.NUMERO_CLIENTE ?? '3001116735'],
  ['UPLOAD_EXPECTED_STATUS', process.env.UPLOAD_EXPECTED_STATUS ?? '400'],
  ['VUS', process.env.VUS ?? '5'],
  ['DURATION', process.env.DURATION ?? '20s'],
];

const args = [
  'run',
  '--rm',
  '-i',
  '-v',
  `${dockerWorkspacePath}:/work`,
  '-w',
  '/work',
  ...envPairs.flatMap(([key, value]) => ['-e', `${key}=${value}`]),
  'grafana/k6:0.51.0',
  'run',
  'scripts/loadtest/k6-upload-dashboard.js',
];

process.stdout.write(`[loadtest:k6] running against ${envPairs[0][1]}\n`);
const result = spawnSync('docker', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
