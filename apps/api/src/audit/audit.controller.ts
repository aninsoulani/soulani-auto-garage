import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: GetAuditLogsDto) {
    return this.auditService.findAll(query);
  }
}
