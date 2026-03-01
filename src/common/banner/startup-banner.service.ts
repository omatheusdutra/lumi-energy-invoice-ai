import { Injectable } from '@nestjs/common';
import boxen from 'boxen';
import chalk, { Chalk } from 'chalk';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { env } from '../config/env';
import { log } from '../logging/logger';

interface PackageJsonMeta {
  version?: string;
}

function toDisplayUrl(url: string): string {
  return url.replace('://[::1]', '://localhost');
}

function readVersion(): string {
  const versionFromEnv = process.env.npm_package_version?.trim();
  if (versionFromEnv) {
    return versionFromEnv;
  }

  try {
    const file = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    // Handles files written with UTF-8 BOM (common on Windows).
    const normalized = file.replace(/^\uFEFF/, '');
    const parsed = JSON.parse(normalized) as PackageJsonMeta;
    return parsed.version?.trim() ?? '';
  } catch {
    return '';
  }
}

function readCommitHash(): string {
  if (process.env.GIT_COMMIT && process.env.GIT_COMMIT.trim().length > 0) {
    return process.env.GIT_COMMIT.slice(0, 12);
  }

  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

@Injectable()
export class StartupBannerService {
  print(rawUrl: string): void {
    const url = toDisplayUrl(rawUrl);
    const commit = readCommitHash();
    const payload = {
      type: 'startup',
      app: env.APP_NAME,
      env: env.NODE_ENV,
      version: readVersion() || undefined,
      commit: commit || undefined,
      url,
      docs: `${url}/docs`,
      liveness: `${url}/health/liveness`,
      readiness: `${url}/health/readiness`,
    };

    if (env.LOG_FORMAT === 'json' || env.NODE_ENV === 'production') {
      log({ level: 'info', ...payload });
      return;
    }

    const canColor = process.stdout.isTTY;
    const tone = canColor ? chalk : new Chalk({ level: 0 });
    const label = (text: string): string => tone.gray(text);
    const value = (text: string): string => tone.greenBright(text);

    const titleParts = [env.APP_NAME];
    if (payload.version) {
      titleParts.push(payload.version);
    }
    if (payload.commit) {
      titleParts.push(payload.commit);
    }
    const bannerTitle = titleParts.join(' - ');

    const endpointLine = (name: string, endpoint: string): string =>
      `${label(name.padEnd(10))}: ${value(endpoint)}`;

    const content = [
      tone.bold.cyan(bannerTitle),
      '',
      `${label('Environment'.padEnd(10))}: ${value(env.NODE_ENV)}`,
      endpointLine('Base URL', payload.url),
      endpointLine('Docs', payload.docs),
      endpointLine('Liveness', payload.liveness),
      endpointLine('Readiness', payload.readiness),
    ].join('\n');

    const banner = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: canColor ? 'cyan' : undefined,
    });

    process.stdout.write(`${banner}\n`);
  }
}
