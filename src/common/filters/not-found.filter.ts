import { Request, Response } from 'express';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  NotFoundException,
} from '@nestjs/common';

@Catch(NotFoundException)
export class NotFoundFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const start = Date.now();
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    this.logger.warn(
      `${req.method} ${req.originalUrl} 404 - ${Date.now() - start}ms`,
    );

    res.status(404).json({
      statusCode: 404,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      error: 'Not Found',
    });
  }
}
