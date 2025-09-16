import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();

    let message: string = 'Произошла ошибка';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const statusCode = (exceptionResponse as any).statusCode;
      const messageResp = (exceptionResponse as any).message;

      switch (statusCode) {
        case 401:
          message = 'Доступ отклонён, войдите в систему и попробуйте снова';
          break;

        default:
          message = messageResp;
          break;
      }
    }

    res.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
