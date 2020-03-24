import * as winston from 'winston';

const _winston = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.errors({ stack: true }),
        winston.format.colorize({ all: true }),
        winston.format.simple(),
        winston.format.printf((info) => `[${info.module}/${info._level}]:${info.message}`)
    )
});

export default class Logger {
    public static forModule(module: string) {
        const logger = new Logger();
        logger._module = module;
        return logger;
    }

    private _module: string;

    public info(message: string, ...args: any): void {
        _winston.info(message, ...args, {
            module: this._module,
            _level: 'INFO',
            extra: true
        });
    }

    public warn(message: any, ...args: any): void {
        _winston.warn(message, ...args, {
            module: this._module,
            _level: 'WARN',
            extra: true
        });
    }

    public error(message: any, ...args: any): void {
        _winston.error(message, ...args, {
            module: this._module,
            _level: 'ERROR',
            extra: true
        });
    }
}
