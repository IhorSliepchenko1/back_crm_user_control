import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('LoggerMiddleware');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, baseUrl, url } = req;
    this.logger.log(`[${method}] ${baseUrl}${url} - ${res.statusCode}`);
    req.body && this.logger.debug(`body: ${JSON.stringify(req.body)}`);
    next();
  }
}
