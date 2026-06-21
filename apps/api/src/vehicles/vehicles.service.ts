import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import {
  AuditAction,
  VehicleStatus,
  BookingStatus,
  BlackoutReason,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import { areIntervalsOverlapping } from 'date-fns';

/** Shared vehicle include shape for public listing */
const LISTING_INCLUDE = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
  },
  salesListing: { where: { deletedAt: null } },
  rentalListing: {
    where: { deletedAt: null },
    include: {
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
      },
    },
  },
} as const;

/** Full include for detail page */
const DETAIL_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  inspections: {
    where: { deletedAt: null },
    orderBy: { inspectionDate: 'desc' as const },
    take: 1,
  },
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
    const apiUrl =
      this.config.get<string>('API_BASE_URL') || 'http://localhost:3001';
    return `${apiUrl}${localPath}`;
  }

  /** Add computed imageUrl to every VehicleImage in a result object and compute active rented status */
  private enrichImages<
    T extends { images?: any[]; status?: any; rentalListing?: any },
  >(vehicle: T): T {
    if (!vehicle) return vehicle;

    // Dynamically compute rented status based on exact current time
    let computedStatus = vehicle.status;
    if (
      vehicle.status === ('RENTED' as any) ||
      vehicle.status === VehicleStatus.ACTIVE
    ) {
      const now = new Date();
      const hasActiveBooking = vehicle.rentalListing?.bookings?.some(
        (b: any) =>
          b.status === 'ACTIVE' &&
          new Date(b.startDate) <= now &&
          new Date(b.endDate) >= now,
      );
      computedStatus = hasActiveBooking
        ? ('RENTED' as any)
        : VehicleStatus.ACTIVE;
    }

    // Safely remove bookings so we don't leak them in public endpoints
    const cleanedVehicle = { ...vehicle, status: computedStatus };
    if (cleanedVehicle.rentalListing?.bookings) {
      delete cleanedVehicle.rentalListing.bookings;
    }

    if (!cleanedVehicle.images) return cleanedVehicle;
    return {
      ...cleanedVehicle,
      images: cleanedVehicle.images.map((img: any) => ({
        ...img,
        imageUrl: this.resolveImageUrl(img.fileUrl),
      })),
    };
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────

  async create(
    dto: CreateVehicleDto,
    files: Express.Multer.File[],
    userId: number,
  ) {
    const {
      salesPrice,
      salesPreviousOwners,
      rentalDailyRate,
      rentalDepositAmount,
      rentalIsLongTermEligible,
      inspectionDate,
      inspectorName,
      inspectionEngineStatus,
      inspectionTransmissionStatus,
      inspectionSuspensionStatus,
      inspectionElectricalStatus,
      inspectionAcStatus,
      inspectionTiresStatus,
      inspectionInteriorStatus,
      inspectionExteriorStatus,
      inspectionGeneralNotes,
      ...coreData
    } = dto;

    const slug = this.generateSlug(
      coreData.make,
      coreData.model,
      coreData.year,
    );
    const data: any = { ...coreData };
    if (!data.vin) data.vin = null;
    if (!data.plateNumber) data.plateNumber = null;
    if (!data.chassisNumber) data.chassisNumber = null;
    if (!data.engineNumber) data.engineNumber = null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const {
          images,
          rentalIsDriverAvailable,
          isDriverAvailable,
          rentalDriverFeePerDay,
          driverFeePerDay,
          ...prismaData
        } = data; // Strip frontend images array and nested fields

        const vehicle = await tx.vehicle.create({
          data: {
            ...prismaData,
            slug,
            createdById: userId,
            status: data.status || VehicleStatus.ACTIVE,
            images:
              files && files.length > 0
                ? {
                    create: files.map((file, index) => ({
                      fileUrl: `/uploads/vehicles/${file.filename}`,
                      filePath: file.path,
                      isPrimary: index === 0,
                      sortOrder: index,
                      createdById: userId,
                    })),
                  }
                : undefined,
          },
        });

        if (['SALE', 'BOTH'].includes(vehicle.listingType) && salesPrice) {
          await tx.salesListing.create({
            data: {
              vehicleId: vehicle.id,
              price: salesPrice,
              previousOwners: salesPreviousOwners || 0,
              createdById: userId,
            },
          });
        }

        if (
          ['RENTAL', 'BOTH'].includes(vehicle.listingType) &&
          rentalDailyRate
        ) {
          await tx.rentalListing.create({
            data: {
              vehicleId: vehicle.id,
              dailyRate: rentalDailyRate,
              depositAmount: rentalDepositAmount || 0,
              isLongTermEligible: rentalIsLongTermEligible || false,
              isDriverAvailable:
                (isDriverAvailable ?? rentalIsDriverAvailable) === true,
              driverFeePerDay: driverFeePerDay ?? rentalDriverFeePerDay ?? null,
              createdById: userId,
            },
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
            },
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

  async findAll(query: QueryVehicleDto, isAdmin: boolean = false) {
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
      withDriver,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      if (status === ('RENTED' as any)) {
        where.status = VehicleStatus.ACTIVE;
        where.rentalListing = {
          ...(where.rentalListing || {}),
          bookings: {
            some: {
              status: BookingStatus.ACTIVE,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        };
      } else {
        where.status = status;
      }
    } else {
      if (isAdmin) {
        where.status = {
          in: [
            VehicleStatus.ACTIVE,
            VehicleStatus.SOLD,
            VehicleStatus.MAINTENANCE,
          ],
        };
      } else {
        where.status = {
          in: [
            VehicleStatus.ACTIVE,
            VehicleStatus.SOLD,
            VehicleStatus.MAINTENANCE,
          ],
        }; // Show MAINTENANCE for public rentals
      }
    }
    if (listingType) {
      if (listingType === 'SALE') {
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { listingType: 'SALE' },
            {
              AND: [
                { listingType: 'BOTH' },
                {
                  OR: [
                    { rentalListing: null },
                    {
                      rentalListing: {
                        bookings: {
                          none: {
                            status: BookingStatus.ACTIVE,
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        });
      } else if (listingType === 'RENTAL') {
        where.listingType = { in: ['RENTAL', 'BOTH'] };
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
        where.salesListing = {
          ...(where.salesListing || {}),
          deletedAt: null,
          price: priceCondition,
        };
      } else if (listingType === 'RENTAL') {
        where.rentalListing = {
          ...(where.rentalListing || {}),
          deletedAt: null,
          dailyRate: priceCondition,
        };
      } else {
        where.OR = [
          ...(where.OR || []),
          {
            salesListing: {
              ...(where.salesListing || {}),
              deletedAt: null,
              price: priceCondition,
            },
          },
          {
            rentalListing: {
              ...(where.rentalListing || {}),
              deletedAt: null,
              dailyRate: priceCondition,
            },
          },
        ];
      }
    }

    if (withDriver !== undefined) {
      where.rentalListing = {
        ...(where.rentalListing || {}),
        isDriverAvailable: withDriver,
      };
    }

    // Sort strategy
    let orderBy: any = { createdAt: 'desc' }; // newest (default)

    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price:asc':
        orderBy =
          listingType === 'RENTAL'
            ? { rentalListing: { dailyRate: 'asc' } }
            : { salesListing: { price: 'asc' } };
        break;
      case 'price:desc':
        orderBy =
          listingType === 'RENTAL'
            ? { rentalListing: { dailyRate: 'desc' } }
            : { salesListing: { price: 'desc' } };
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

    const {
      salesPrice,
      salesPreviousOwners,
      rentalDailyRate,
      rentalDepositAmount,
      rentalIsLongTermEligible,
      inspectionDate,
      inspectorName,
      inspectionEngineStatus,
      inspectionTransmissionStatus,
      inspectionSuspensionStatus,
      inspectionElectricalStatus,
      inspectionAcStatus,
      inspectionTiresStatus,
      inspectionInteriorStatus,
      inspectionExteriorStatus,
      inspectionGeneralNotes,
      ...coreData
    } = updateVehicleDto as any;

    const data: any = { ...coreData };

    if (data.vin === '') data.vin = null;
    if (data.plateNumber === '') data.plateNumber = null;
    if (data.chassisNumber === '') data.chassisNumber = null;
    if (data.engineNumber === '') data.engineNumber = null;

    return this.prisma.$transaction(async (tx) => {
      const {
        rentalIsDriverAvailable,
        isDriverAvailable,
        rentalDriverFeePerDay,
        driverFeePerDay,
        ...prismaData
      } = data;
      const vehicle = await tx.vehicle.update({
        where: { id },
        data: prismaData,
      });

      if (
        ['SALE', 'BOTH'].includes(vehicle.listingType) &&
        salesPrice !== undefined
      ) {
        await tx.salesListing.upsert({
          where: { vehicleId: id },
          update: {
            price: salesPrice,
            previousOwners: salesPreviousOwners || 0,
          },
          create: {
            vehicleId: id,
            price: salesPrice,
            previousOwners: salesPreviousOwners || 0,
            createdById: userId,
          },
        });
      }

      if (
        ['RENTAL', 'BOTH'].includes(vehicle.listingType) &&
        rentalDailyRate !== undefined
      ) {
        await tx.rentalListing.upsert({
          where: { vehicleId: id },
          update: {
            dailyRate: rentalDailyRate,
            depositAmount: rentalDepositAmount || 0,
            isLongTermEligible: rentalIsLongTermEligible || false,
            isDriverAvailable:
              (isDriverAvailable ?? rentalIsDriverAvailable) === true,
            driverFeePerDay: driverFeePerDay ?? rentalDriverFeePerDay ?? null,
          },
          create: {
            vehicleId: id,
            dailyRate: rentalDailyRate,
            depositAmount: rentalDepositAmount || 0,
            isLongTermEligible: rentalIsLongTermEligible || false,
            isDriverAvailable:
              (isDriverAvailable ?? rentalIsDriverAvailable) === true,
            driverFeePerDay: driverFeePerDay ?? rentalDriverFeePerDay ?? null,
            createdById: userId,
          },
        });
      }

      if (inspectionDate && inspectorName) {
        const latestInspection = await tx.vehicleInspection.findFirst({
          where: { vehicleId: id, deletedAt: null },
          orderBy: { inspectionDate: 'desc' },
        });

        if (latestInspection) {
          await tx.vehicleInspection.update({
            where: { id: latestInspection.id },
            data: {
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
            },
          });
        } else {
          await tx.vehicleInspection.create({
            data: {
              vehicleId: id,
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
            },
          });
        }
      }

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
      include: { images: true, inspections: { where: { deletedAt: null } } },
    });

    if (!vehicle)
      throw new NotFoundException(`Vehicle with ID ${id} not found`);

    if (vehicle.images.length < 3) {
      throw new UnprocessableEntityException(
        'Vehicle must have at least 3 images to be published.',
      );
    }

    if (vehicle.inspections.length === 0) {
      throw new UnprocessableEntityException(
        'Vehicle must have a completed inspection report to be published.',
      );
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.ACTIVE },
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

  async getAvailability(id: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id, deletedAt: null },
      include: {
        rentalListing: { where: { deletedAt: null } },
        blackoutDates: {
          where: { deletedAt: null, endDate: { gte: today } },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle not found`);
    }

    let bookings: any[] = [];
    if (vehicle.rentalListing) {
      bookings = await this.prisma.rentalBooking.findMany({
        where: {
          rentalListingId: vehicle.rentalListing.id,
          deletedAt: null,
          status: { in: [BookingStatus.ACTIVE, BookingStatus.CONFIRMED] },
          endDate: { gte: today },
        },
      });
    }

    const unavailableIntervals: Array<{ start: string; end: string }> = [];

    // Map blackout dates to exact time + 1 Hour Buffer
    vehicle.blackoutDates.forEach((bd) => {
      const start = new Date(bd.startDate);
      const end = new Date(bd.endDate);
      end.setHours(end.getHours() + 1);
      unavailableIntervals.push({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    });

    // Map confirmed bookings with exact time + 1 Hour Buffer
    bookings.forEach((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      end.setHours(end.getHours() + 1);
      unavailableIntervals.push({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    });

    return { unavailableIntervals };
  }

  async getBlackoutDates(id: number) {
    return this.prisma.blackoutDate.findMany({
      where: { vehicleId: id, deletedAt: null },
      orderBy: { startDate: 'asc' },
    });
  }

  async addBlackoutDate(
    id: number,
    dto: CreateBlackoutDateDto,
    userId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id, deletedAt: null },
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found');

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);

      // Fetch existing blackouts
      const existingBlackouts = await tx.blackoutDate.findMany({
        where: { vehicleId: id, deletedAt: null },
      });

      const isOverlappingBlackout = existingBlackouts.some((b) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        bEnd.setHours(bEnd.getHours() + 1); // 1 Hour Buffer
        return areIntervalsOverlapping(
          { start: bStart, end: bEnd },
          { start, end },
          { inclusive: false },
        );
      });

      if (isOverlappingBlackout) {
        throw new UnprocessableEntityException(
          'Gagal: Waktu blackout bertabrakan dengan blackout date lain.',
        );
      }

      // Fetch existing confirmed bookings
      const rentalListing = await tx.rentalListing.findUnique({
        where: { vehicleId: id, deletedAt: null },
      });

      if (rentalListing) {
        const existingBookings = await tx.rentalBooking.findMany({
          where: {
            rentalListingId: rentalListing.id,
            deletedAt: null,
            status: { in: [BookingStatus.ACTIVE, BookingStatus.CONFIRMED] },
          },
        });

        const isOverlappingBooking = existingBookings.some((b) => {
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          bEnd.setHours(bEnd.getHours() + 1); // 1 Hour Buffer
          return areIntervalsOverlapping(
            { start: bStart, end: bEnd },
            { start, end },
            { inclusive: false },
          );
        });

        if (isOverlappingBooking) {
          throw new UnprocessableEntityException(
            'Gagal: Waktu blackout bertabrakan dengan pemesanan kendaraan yang sudah dikonfirmasi.',
          );
        }
      }

      const blackout = await tx.blackoutDate.create({
        data: {
          vehicleId: id,
          startDate: start,
          endDate: end,
          reason: dto.reason,
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          moduleName: 'BlackoutDates',
          recordId: blackout.id,
          newValue: JSON.parse(JSON.stringify(blackout)),
        },
      });

      return blackout;
    });
  }

  async removeBlackoutDate(id: number, dateId: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const blackout = await tx.blackoutDate.findFirst({
        where: { id: dateId, vehicleId: id, deletedAt: null },
      });
      if (!blackout) throw new NotFoundException('Blackout date not found');

      await tx.blackoutDate.update({
        where: { id: dateId },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.DELETE,
          moduleName: 'BlackoutDates',
          recordId: blackout.id,
          previousValue: JSON.parse(JSON.stringify(blackout)),
        },
      });

      return { success: true };
    });
  }
}
