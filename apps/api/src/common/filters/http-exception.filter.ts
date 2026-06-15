import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
