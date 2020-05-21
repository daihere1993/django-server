import { createLogger, transports, format } from 'winston';

const ws = createLogger({
  transports: [new transports.Console()],
  format: format.combine(
    format.splat(),
    format.errors({ stack: true }),
    format.colorize({ all: true }),
    format.simple(),
    format.printf(
      // eslint-disable-next-line no-underscore-dangle
      info => `[${info.module}/${info._level}]:${info.message}`,
    ),
  ),
});

export default class Logger {
  public static forModule(module: string): Logger {
    const logger = new Logger();
    logger.module = module;
    return logger;
  }

  private module: string;

  public info(message: string, ...args: any): void {
    ws.info(message, ...args, {
      module: this.module,
      _level: 'INFO',
      extra: true,
    });
  }

  public warn(message: string, ...args: any): void {
    ws.warn(message, ...args, {
      module: this.module,
      _level: 'WARN',
      extra: true,
    });
  }

  public error(message: string, ...args: any): void {
    ws.error(message, ...args, {
      module: this.module,
      _level: 'ERROR',
      extra: true,
    });
  }
}
