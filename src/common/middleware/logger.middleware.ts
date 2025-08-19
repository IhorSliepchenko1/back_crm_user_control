import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('LOGGER');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, baseUrl, url } = req;

    res.on('finish', () => {
      const status = res.statusCode;
      const logLevel = this.getLogLevel(status);

      this.logger.log(`[${method}] ${baseUrl}${url} -> ${status}`);
      if (req.body) {
        const body = JSON.stringify(req.body).slice(0, 1000);
        this.logger[logLevel](`body: ${body}`);
      }
    });

    next();
  }

  private getLogLevel(status: number): 'debug' | 'warn' | 'error' {
    if (status >= 400) return 'error';
    if (status >= 300) return 'warn';
    return 'debug';
  }
}
