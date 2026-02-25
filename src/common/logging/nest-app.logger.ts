import { ConsoleLogger, ConsoleLoggerOptions, LogLevel } from '@nestjs/common';

const SUPPRESSED_CONTEXTS = new Set(['InstanceLoader', 'RoutesResolver', 'RouterExplorer']);

export class NestAppLogger extends ConsoleLogger {
  constructor(
    context = 'NestApplication',
    options?: ConsoleLoggerOptions & { logLevels?: LogLevel[] },
  ) {
    super(context, options ?? {});
  }

  override log(message: unknown, context?: string): void {
    if (context && SUPPRESSED_CONTEXTS.has(context)) {
      return;
    }
    super.log(message, context);
  }
}
