import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetAuditLogsDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.moduleName) {
      where.moduleName = query.moduleName;
    }
    if (query.action) {
      where.action = query.action as any;
    }
    if (query.userId) {
      where.userId = Number(query.userId);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
