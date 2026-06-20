import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      let target = exception.meta?.target as any;

      if (typeof target === 'string') {
        target = [target.replace(/^[a-z]+_/, '').replace(/_key$/, '')];
      }

      if (Array.isArray(target) && target.length > 0) {
        if (target.includes('slug')) {
          message = 'A vehicle with this Make, Model, and Year already exists.';
        } else {
          const fields = target
            .map((t: string) =>
              t
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            )
            .join(', ');
          message = `A record with this ${fields} already exists.`;
        }
      } else {
        message = 'A record with this unique information already exists.';
      }
    } else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'Record not found';
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Prisma Error ${exception.code}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
    });
  }
}
