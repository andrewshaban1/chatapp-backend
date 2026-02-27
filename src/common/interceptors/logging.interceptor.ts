import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const { method, originalUrl } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${originalUrl} ${res.statusCode} - ${ms}ms`);
      }),
      catchError((error: unknown) => {
        const ms = Date.now() - start;
        const status = error instanceof HttpException ? error.getStatus() : 500;
        if (status >= 400 && status < 500) {
          this.logger.warn(`${method} ${originalUrl} ${status} - ${ms}ms`);
        } else {
          this.logger.error(`${method} ${originalUrl} ${status} - ${ms}ms`);
        }
        return throwError(() => error);
      }),
    );
  }
}
