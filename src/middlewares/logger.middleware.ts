import { Injectable, NestMiddleware, HttpService } from '@nestjs/common';
import { Request, Response } from 'express';

import Logger from '../logger';

const logger = Logger.forModule('dic.middleware');

@Injectable()
export default class LoggerMiddleware implements NestMiddleware {
  public constructor(private readonly httpService: HttpService) {}

  public use(req: Request, res: Response, next: Function): void {
    logger.info('[%s] %s has requested', req.body.model, req.originalUrl);
    next();
  }
}
