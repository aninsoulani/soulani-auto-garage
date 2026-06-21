import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: AuditAction;
  moduleName: string;
}

export const AuditLog = (action: AuditAction, moduleName: string) =>
  SetMetadata(AUDIT_LOG_KEY, { action, moduleName });
