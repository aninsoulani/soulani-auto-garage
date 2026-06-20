import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { areIntervalsOverlapping } from 'date-fns';
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
    const apiUrl =
      this.config.get<string>('API_BASE_URL') || 'http://localhost:3001';
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

      // Validate 24-hour minimum duration
      const durationMs = end.getTime() - start.getTime();
      if (durationMs < 24 * 60 * 60 * 1000) {
        throw new UnprocessableEntityException(
          'Minimal durasi sewa adalah 24 jam.',
        );
      }

      // 2. Overlap validation
      const existingBookings = await tx.rentalBooking.findMany({
        where: {
          rentalListingId: createDto.rentalListingId,
          deletedAt: null,
          status: { in: [BookingStatus.ACTIVE, BookingStatus.CONFIRMED] },
        },
      });

      const isOverlappingBooking = existingBookings.some((b) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        bEnd.setHours(bEnd.getHours() + 1); // 1 Hour Handover Buffer
        return areIntervalsOverlapping(
          { start: bStart, end: bEnd },
          { start, end },
          { inclusive: false },
        );
      });

      if (isOverlappingBooking) {
        throw new UnprocessableEntityException(
          'Dates overlap with an existing confirmed booking.',
        );
      }

      const existingBlackouts = await tx.blackoutDate.findMany({
        where: {
          vehicleId: listing.vehicleId,
          deletedAt: null,
        },
      });

      const isOverlappingBlackout = existingBlackouts.some((b) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        bEnd.setHours(bEnd.getHours() + 1); // 1 Hour Handover Buffer
        return areIntervalsOverlapping(
          { start: bStart, end: bEnd },
          { start, end },
          { inclusive: false },
        );
      });

      if (isOverlappingBlackout) {
        throw new UnprocessableEntityException(
          'Dates overlap with a blackout/maintenance period.',
        );
      }

      // Fetch payment method
      const paymentMethod = await tx.paymentMethod.findUnique({
        where: { id: createDto.paymentMethodId, deletedAt: null },
      });
      if (!paymentMethod) {
        throw new NotFoundException('Payment method not found.');
      }

      // 3. Calculate total price (simplified logic: days * dailyRate)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) diffDays = 1;

      let totalPrice = Number(listing.dailyRate) * diffDays;
      if (createDto.withDriver && listing.isDriverAvailable) {
        const driverFee = Number(listing.driverFeePerDay) || 0;
        totalPrice += driverFee * diffDays;
      }

      // 4. Create booking
      const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const countToday = await tx.rentalBooking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });
      const sequenceStr = String(countToday + 1).padStart(4, '0');
      const bookingCode = `INV-${todayStr}-${sequenceStr}`;

      const booking = await tx.rentalBooking.create({
        data: {
          bookingCode,
          rentalListingId: createDto.rentalListingId,
          customerName: createDto.customerName,
          customerPhone: createDto.customerPhone,
          customerEmail: createDto.customerEmail,
          identityNumber: createDto.identityNumber,
          licenseImageUrl: createDto.licenseImageUrl,
          proofOfTransferUrl: createDto.proofOfTransferUrl,
          startDate: start,
          endDate: end,
          paymentMethodId: paymentMethod.id,
          totalPrice,
          withDriver: createDto.withDriver || false,
          whatsappOptIn: createDto.whatsappOptIn || false,
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

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        totalPrice: booking.totalPrice,
        paymentInstructions: paymentMethod.instructions,
        status: booking.status,
      };
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
            include: {
              vehicle: {
                select: {
                  make: true,
                  model: true,
                  slug: true,
                  plateNumber: true,
                  year: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.rentalBooking.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
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
          include: {
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                status: true,
                plateNumber: true,
                year: true,
              },
            },
          },
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

  async updateStatus(
    id: number,
    updateDto: UpdateRentalBookingStatusDto,
    userId: number,
  ) {
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
      } else if (
        updateDto.status === BookingStatus.COMPLETED ||
        updateDto.status === BookingStatus.CANCELLED
      ) {
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

  async updatePaperwork(
    id: number,
    files: {
      license?: Express.Multer.File[];
      proofOfTransfer?: Express.Multer.File[];
      ktp?: Express.Multer.File[];
      sim?: Express.Multer.File[];
    },
    identityNumber?: string,
    userId?: number,
  ) {
    const existing = await this.prisma.rentalBooking.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Rental booking not found`);
    }

    const data: any = {};

    if (identityNumber !== undefined) {
      data.identityNumber = identityNumber;
    }

    // Resolve license/ktp/sim photo
    let licenseFile: Express.Multer.File | undefined = undefined;
    if (files?.license && files.license.length > 0) {
      licenseFile = files.license[0];
    } else if (files?.ktp && files.ktp.length > 0) {
      licenseFile = files.ktp[0];
    } else if (files?.sim && files.sim.length > 0) {
      licenseFile = files.sim[0];
    }

    if (licenseFile) {
      data.licenseImageUrl = `/uploads/licenses/${licenseFile.filename}`;
    }

    // Resolve proof of transfer
    if (files?.proofOfTransfer && files.proofOfTransfer.length > 0) {
      const transferFile = files.proofOfTransfer[0];
      data.proofOfTransferUrl = `/uploads/receipts/${transferFile.filename}`;
    }

    const booking = await this.prisma.rentalBooking.update({
      where: { id },
      data,
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

    return {
      ...booking,
      licenseImageUrl: this.resolveFileUrl(booking.licenseImageUrl),
      proofOfTransferUrl: this.resolveFileUrl(booking.proofOfTransferUrl),
    };
  }
}
