import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class VehicleInspectionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    vehicleId: number,
    createInspectionDto: CreateInspectionDto,
    userId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.vehicleInspection.create({
        data: {
          ...createInspectionDto,
          vehicleId,
          inspectionDate: new Date(createInspectionDto.inspectionDate),
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          moduleName: 'VehicleInspections',
          recordId: inspection.id,
          newValue: JSON.parse(JSON.stringify(inspection)),
        },
      });

      return inspection;
    });
  }

  async findAll(vehicleId: number) {
    return this.prisma.vehicleInspection.findMany({
      where: { vehicleId, deletedAt: null },
      orderBy: { inspectionDate: 'desc' },
    });
  }

  async findOne(id: number, vehicleId: number) {
    const inspection = await this.prisma.vehicleInspection.findUnique({
      where: { id, vehicleId, deletedAt: null },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection ${id} not found`);
    }

    return inspection;
  }

  async update(
    id: number,
    vehicleId: number,
    updateInspectionDto: UpdateInspectionDto,
    userId: number,
  ) {
    const existing = await this.findOne(id, vehicleId);

    return this.prisma.$transaction(async (tx) => {
      const data: any = { ...updateInspectionDto };
      if (data.inspectionDate)
        data.inspectionDate = new Date(data.inspectionDate);

      const inspection = await tx.vehicleInspection.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          moduleName: 'VehicleInspections',
          recordId: inspection.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
          newValue: JSON.parse(JSON.stringify(inspection)),
        },
      });

      return inspection;
    });
  }

  async remove(id: number, vehicleId: number, userId: number) {
    const existing = await this.findOne(id, vehicleId);

    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.vehicleInspection.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.DELETE,
          moduleName: 'VehicleInspections',
          recordId: inspection.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
        },
      });

      return inspection;
    });
  }
}
