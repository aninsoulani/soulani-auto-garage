import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateRentalBookingDto } from './dto/create-rental-booking.dto';
import { UpdateRentalBookingStatusDto } from './dto/update-rental-booking-status.dto';
import { QueryRentalBookingDto } from './dto/query-rental-booking.dto';
import { AuditAction, BookingStatus, VehicleStatus } from '@prisma/client';

@Injectable()
export class RentalBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private resolveFileUrl(localPath: string | null): string | null {
    if (!localPath) return localPath;
    if (localPath.startsWith('http')) return localPath;
    const apiUrl = this.config.get<string>('API_BASE_URL') || 'http://localhost:3001';
    return `${apiUrl}${localPath}`;
  }

  async create(createDto: CreateRentalBookingDto, userId?: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate listing exists
      const listing = await tx.rentalListing.findUnique({
        where: { id: createDto.rentalListingId, deletedAt: null },
      });
      if (!listing) {
        throw new NotFoundException(`Rental listing not found.`);
      }

      const start = new Date(createDto.startDate);
      const end = new Date(createDto.endDate);

      // 2. Overlap validation
      const overlappingBookings = await tx.rentalBooking.findMany({
        where: {
          rentalListingId: createDto.rentalListingId,
          deletedAt: null,
          status: { in: [BookingStatus.ACTIVE, BookingStatus.CONFIRMED] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      });

      if (overlappingBookings.length > 0) {
        throw new UnprocessableEntityException('Dates overlap with an existing confirmed booking.');
      }

      const overlappingBlackouts = await tx.blackoutDate.findMany({
        where: {
          vehicleId: listing.vehicleId,
          deletedAt: null,
          startDate: { lte: end },
          endDate: { gte: start },
        },
      });

      if (overlappingBlackouts.length > 0) {
        throw new UnprocessableEntityException('Dates overlap with a blackout/maintenance period.');
      }

      // 3. Calculate total price (simplified logic: days * dailyRate)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) diffDays = 1;
      const totalPrice = Number(listing.dailyRate) * diffDays;

      // 4. Create booking
      const booking = await tx.rentalBooking.create({
        data: {
          ...createDto,
          startDate: start,
          endDate: end,
          totalPrice,
          createdById: userId || null,
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: AuditAction.CREATE,
            moduleName: 'RentalBookings',
            recordId: booking.id,
            newValue: JSON.parse(JSON.stringify(booking)),
          },
        });
      }

      return booking;
    });
  }

  async findAll(query: QueryRentalBookingDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.rentalBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rentalListing: {
            include: { vehicle: { select: { make: true, model: true, slug: true, plateNumber: true } } },
          },
        },
      }),
      this.prisma.rentalBooking.count({ where }),
    ]);

    return {
      data: data.map(b => ({
        ...b,
        licenseImageUrl: this.resolveFileUrl(b.licenseImageUrl),
        proofOfTransferUrl: this.resolveFileUrl(b.proofOfTransferUrl),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const booking = await this.prisma.rentalBooking.findUnique({
      where: { id, deletedAt: null },
      include: {
        rentalListing: {
          include: { vehicle: { select: { id: true, make: true, model: true, status: true, plateNumber: true } } },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Rental booking with ID ${id} not found`);
    }

    return {
      ...booking,
      licenseImageUrl: this.resolveFileUrl(booking.licenseImageUrl),
      proofOfTransferUrl: this.resolveFileUrl(booking.proofOfTransferUrl),
    };
  }

  async updateStatus(id: number, updateDto: UpdateRentalBookingStatusDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.rentalBooking.findUnique({
        where: { id, deletedAt: null },
        include: { rentalListing: true },
      });

      if (!existing) {
        throw new NotFoundException(`Rental booking not found`);
      }

      const booking = await tx.rentalBooking.update({
        where: { id },
        data: { status: updateDto.status },
      });

      // Automation: Update vehicle status based on booking lifecycle
      if (updateDto.status === BookingStatus.ACTIVE) {
        await tx.vehicle.update({
          where: { id: existing.rentalListing.vehicleId },
          data: { status: VehicleStatus.RENTED },
        });
      } else if (updateDto.status === BookingStatus.COMPLETED || updateDto.status === BookingStatus.CANCELLED) {
        await tx.vehicle.update({
          where: { id: existing.rentalListing.vehicleId },
          data: { status: VehicleStatus.ACTIVE },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          moduleName: 'RentalBookings',
          recordId: booking.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
          newValue: JSON.parse(JSON.stringify(booking)),
        },
      });

      return booking;
    });
  }

  async uploadReceipt(id: number, file: Express.Multer.File, userId?: number) {
    const existing = await this.prisma.rentalBooking.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Rental booking not found`);
    }

    const fileUrl = `/uploads/receipts/${file.filename}`;

    const booking = await this.prisma.rentalBooking.update({
      where: { id },
      data: { proofOfTransferUrl: fileUrl },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          moduleName: 'RentalBookings',
          recordId: booking.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
          newValue: JSON.parse(JSON.stringify(booking)),
        },
      });
    }

    return booking;
  }
}
