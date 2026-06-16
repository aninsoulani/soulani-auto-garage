import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { AuditAction, VehicleStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/** Shared vehicle include shape for public listing */
const LISTING_INCLUDE = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
  },
  salesListing: { where: { deletedAt: null } },
  rentalListing: { where: { deletedAt: null } },
} as const;

/** Full include for detail page */
const DETAIL_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  inspections: { where: { deletedAt: null }, orderBy: { inspectionDate: 'desc' as const }, take: 1 },
  salesListing: { where: { deletedAt: null } },
  rentalListing: { where: { deletedAt: null } },
  analytics: true,
} as const;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────

  private generateSlug(make: string, model: string, year: number): string {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${make}-${model}-${year}-${randomSuffix}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /** Prepend API base URL to a local upload path so the frontend can render it. */
  private resolveImageUrl(localPath: string): string {
    if (!localPath) return localPath;
    // Already an absolute URL (future Cloudinary path) → pass through
    if (localPath.startsWith('http')) return localPath;
    const apiUrl = this.config.get<string>('API_BASE_URL') || 'http://localhost:3001';
    return `${apiUrl}${localPath}`;
  }

  /** Add computed imageUrl to every VehicleImage in a result object */
  private enrichImages<T extends { images?: any[] }>(vehicle: T): T {
    if (!vehicle || !vehicle.images) return vehicle;
    return {
      ...vehicle,
      images: vehicle.images.map((img) => ({
        ...img,
        imageUrl: this.resolveImageUrl(img.fileUrl),
      })),
    };
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────

  async create(dto: CreateVehicleDto, files: Express.Multer.File[], userId: number) {
    const {
      salesPrice, salesPreviousOwners,
      rentalDailyRate, rentalDepositAmount, rentalIsLongTermEligible,
      inspectionDate, inspectorName, inspectionEngineStatus, inspectionTransmissionStatus,
      inspectionSuspensionStatus, inspectionElectricalStatus, inspectionAcStatus,
      inspectionTiresStatus, inspectionInteriorStatus, inspectionExteriorStatus,
      inspectionGeneralNotes,
      ...coreData
    } = dto;

    const slug = this.generateSlug(coreData.make, coreData.model, coreData.year);
    const data: any = { ...coreData };
    if (!data.vin) data.vin = null;
    if (!data.plateNumber) data.plateNumber = null;
    if (!data.chassisNumber) data.chassisNumber = null;
    if (!data.engineNumber) data.engineNumber = null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const { images, ...prismaData } = data; // Strip frontend images array
        
        const vehicle = await tx.vehicle.create({
          data: { 
            ...prismaData, 
            slug, 
            createdById: userId, 
            status: data.status || VehicleStatus.ACTIVE,
            images: files && files.length > 0 ? {
              create: files.map((file, index) => ({
                fileUrl: `/uploads/vehicles/${file.filename}`,
                filePath: file.path,
                isPrimary: index === 0,
                sortOrder: index,
                createdById: userId,
              }))
            } : undefined
          },
        });

        if (['SALE', 'BOTH'].includes(vehicle.listingType) && salesPrice) {
          await tx.salesListing.create({
            data: {
              vehicleId: vehicle.id,
              price: salesPrice,
              previousOwners: salesPreviousOwners || 0,
              createdById: userId,
            }
          });
        }

        if (['RENTAL', 'BOTH'].includes(vehicle.listingType) && rentalDailyRate) {
          await tx.rentalListing.create({
            data: {
              vehicleId: vehicle.id,
              dailyRate: rentalDailyRate,
              depositAmount: rentalDepositAmount || 0,
              isLongTermEligible: rentalIsLongTermEligible || false,
              createdById: userId,
            }
          });
        }

        if (inspectionDate && inspectorName) {
          await tx.vehicleInspection.create({
            data: {
              vehicleId: vehicle.id,
              inspectionDate: new Date(inspectionDate),
              inspectorName,
              engineStatus: inspectionEngineStatus || 'PASS',
              transmissionStatus: inspectionTransmissionStatus || 'PASS',
              suspensionStatus: inspectionSuspensionStatus || 'PASS',
              electricalStatus: inspectionElectricalStatus || 'PASS',
              acStatus: inspectionAcStatus || 'PASS',
              tiresStatus: inspectionTiresStatus || 'PASS',
              interiorStatus: inspectionInteriorStatus || 'PASS',
              exteriorStatus: inspectionExteriorStatus || 'PASS',
              generalNotes: inspectionGeneralNotes || '',
              createdById: userId,
            }
          });
        }

        // Images are handled via nested create in vehicle.create

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
    } catch (error) {
      // Clean up uploaded files if the transaction fails
      if (files && files.length > 0) {
        files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      throw error;
    }
  }

  async findAll(query: QueryVehicleDto) {
    const {
      page = 1,
      limit = 10,
      status,
      listingType,
      search,
      isFeatured,
      isNewArrival,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      sort,
      carType,
      year,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['ACTIVE', 'SOLD', 'MAINTENANCE'] };
    }
    if (listingType) {
      if (listingType === 'SALE' || listingType === 'RENTAL') {
        where.listingType = { in: [listingType, 'BOTH'] };
      } else {
        where.listingType = listingType;
      }
    }
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
    if (transmission) where.transmission = transmission;
    if (fuelType) where.fuelType = fuelType;
    if (carType) where.carType = carType;
    if (year) where.year = year;

    // Full-text search on make + model + plateNumber
    if (search) {
      where.OR = [
        { make: { contains: search } },
        { model: { contains: search } },
        { plateNumber: { contains: search } },
      ];
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceCondition = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };

      if (listingType === 'SALE') {
        where.salesListing = { deletedAt: null, price: priceCondition };
      } else if (listingType === 'RENTAL') {
        where.rentalListing = { deletedAt: null, dailyRate: priceCondition };
      } else {
        where.OR = [
          ...(where.OR || []),
          { salesListing: { deletedAt: null, price: priceCondition } },
          { rentalListing: { deletedAt: null, dailyRate: priceCondition } }
        ];
      }
    }


    // Sort strategy
    let orderBy: any = { createdAt: 'desc' }; // newest (default)
    
    switch(sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price:asc':
        orderBy = { salesListing: { price: 'asc' } };
        break;
      case 'price:desc':
        orderBy = { salesListing: { price: 'desc' } };
        break;
      case 'year:asc':
        orderBy = { year: 'asc' };
        break;
      case 'year:desc':
        orderBy = { year: 'desc' };
        break;
      case 'mileage:asc':
        orderBy = { mileage: 'asc' };
        break;
      case 'mileage:desc':
        orderBy = { mileage: 'desc' };
        break;
    }

    const [raw, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: LISTING_INCLUDE,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const data = raw.map((v) => this.enrichImages(v));

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
    return this.enrichImages(vehicle);
  }

  /** Public: look up a vehicle by its immutable slug. Returns full detail. */
  async findBySlug(slug: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { slug, deletedAt: null },
      include: DETAIL_INCLUDE,
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with slug "${slug}" not found`);
    }

    // Note: Analytics tracking is now handled asynchronously by the frontend 
    // calling the POST /analytics/vehicles/:id/track-view endpoint.

    return this.enrichImages(vehicle as any);
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto, userId: number) {
    const existing = await this.findOne(id);

    const data: any = { ...updateVehicleDto };
    

    if (data.vin === '') data.vin = null;
    if (data.plateNumber === '') data.plateNumber = null;
    if (data.chassisNumber === '') data.chassisNumber = null;
    if (data.engineNumber === '') data.engineNumber = null;

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({ where: { id }, data });

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

  async publishVehicle(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { images: true, inspections: { where: { deletedAt: null } } }
    });

    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${id} not found`);

    if (vehicle.images.length < 3) {
      throw new UnprocessableEntityException('Vehicle must have at least 3 images to be published.');
    }
    
    if (vehicle.inspections.length === 0) {
      throw new UnprocessableEntityException('Vehicle must have a completed inspection report to be published.');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.ACTIVE }
    });
  }

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.salesListing.updateMany({
        where: { vehicleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await tx.rentalListing.updateMany({
        where: { vehicleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await tx.vehicleImage.deleteMany({ where: { vehicleId: id } });

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
