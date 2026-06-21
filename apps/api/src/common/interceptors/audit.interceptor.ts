import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  AUDIT_LOG_KEY,
  AuditLogMetadata,
} from '../decorators/audit-log.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMeta = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditMeta) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id || null; // Assume JwtAuthGuard has populated req.user

    return next.handle().pipe(
      tap(async (data) => {
        try {
          // Attempt to find the primary record ID from the returned data
          // Typically NestJS responses return the created/updated object which contains an `id` field
          const recordId = data && data.id ? Number(data.id) : 0;

          let newValue = undefined;
          if (data) {
            // Stringify and parse to strip out functions/circular refs just in case
            newValue = JSON.parse(JSON.stringify(data));
          }

          await this.prisma.auditLog.create({
            data: {
              userId,
              action: auditMeta.action,
              moduleName: auditMeta.moduleName,
              recordId,
              newValue,
            },
          });
        } catch (error) {
          console.error('[AuditInterceptor] Failed to save audit log:', error);
        }
      }),
    );
  }
}
