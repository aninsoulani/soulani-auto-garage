import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { AuditAction } from '@prisma/client';

export class GetAuditLogsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  moduleName?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsNumberString()
  userId?: string;
}
