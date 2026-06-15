import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(make: string, model: string, year: number): string {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${make}-${model}-${year}-${randomSuffix}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(createVehicleDto: CreateVehicleDto, userId: number) {
    const slug = this.generateSlug(createVehicleDto.make, createVehicleDto.model, createVehicleDto.year);
    
    const data: any = { ...createVehicleDto };
    if (!data.vin) data.vin = null;
    if (!data.plateNumber) data.plateNumber = null;
    if (!data.chassisNumber) data.chassisNumber = null;
    if (!data.engineNumber) data.engineNumber = null;

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          ...data,
          slug,
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          moduleName: 'Vehicles',
          recordId: vehicle.id,
          newValue: JSON.parse(JSON.stringify(vehicle)),
        },
      });

      return vehicle;
    });
  }

  async findAll(query: QueryVehicleDto) {
    const { page = 1, limit = 10, status, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (status) where.status = status;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
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

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id, deletedAt: null },
      include: {
        images: true,
        inspections: { where: { deletedAt: null } },
        salesListing: { where: { deletedAt: null } },
        rentalListing: { where: { deletedAt: null } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto, userId: number) {
    const existing = await this.findOne(id);

    const data: any = { ...updateVehicleDto };
    if (data.vin === "") data.vin = null;
    if (data.plateNumber === "") data.plateNumber = null;
    if (data.chassisNumber === "") data.chassisNumber = null;
    if (data.engineNumber === "") data.engineNumber = null;

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          moduleName: 'Vehicles',
          recordId: vehicle.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
          newValue: JSON.parse(JSON.stringify(vehicle)),
        },
      });

      return vehicle;
    });
  }

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete related sub-records safely inside transaction
      await tx.salesListing.updateMany({
        where: { vehicleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await tx.rentalListing.updateMany({
        where: { vehicleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await tx.vehicleImage.deleteMany({
        where: { vehicleId: id },
      });

      await tx.vehicleInspection.updateMany({
        where: { vehicleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.DELETE,
          moduleName: 'Vehicles',
          recordId: vehicle.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
        },
      });

      return vehicle;
    });
  }
}
