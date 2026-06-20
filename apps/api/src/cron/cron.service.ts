import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, VehicleStatus, BlackoutReason } from '@prisma/client';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly prisma: PrismaService) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleOverdueBookings() {
    this.logger.debug('Running handleOverdueBookings cron job...');
    try {
      const now = new Date();
      const overdueBookings = await this.prisma.rentalBooking.findMany({
        where: {
          status: BookingStatus.ACTIVE,
          endDate: {
            lt: now, // End date is in the past
          },
          deletedAt: null,
        },
      });

      if (overdueBookings.length > 0) {
        for (const booking of overdueBookings) {
          await this.prisma.rentalBooking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.OVERDUE,
            },
          });
          this.logger.log(
            `Booking ${booking.bookingCode} (ID: ${booking.id}) has been automatically marked as OVERDUE.`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to update overdue bookings', error);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleActiveBookings() {
    this.logger.debug('Running handleActiveBookings cron job...');
    try {
      const now = new Date();
      const confirmedBookings = await this.prisma.rentalBooking.findMany({
        where: {
          status: BookingStatus.CONFIRMED,
          startDate: {
            lte: now,
          },
          deletedAt: null,
        },
      });

      if (confirmedBookings.length > 0) {
        for (const booking of confirmedBookings) {
          await this.prisma.rentalBooking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.ACTIVE,
            },
          });
          this.logger.log(
            `Booking ${booking.bookingCode} (ID: ${booking.id}) has been automatically activated (status set to ACTIVE).`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to automatically activate bookings', error);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMaintenanceVehicles() {
    this.logger.debug('Running handleMaintenanceVehicles cron job...');
    try {
      const now = new Date();
      const vehiclesToMaintain = await this.prisma.vehicle.findMany({
        where: {
          status: VehicleStatus.ACTIVE,
          deletedAt: null,
          blackoutDates: {
            some: {
              reason: BlackoutReason.MAINTENANCE,
              startDate: { lte: now },
              endDate: { gte: now },
              deletedAt: null,
            },
          },
        },
      });

      if (vehiclesToMaintain.length > 0) {
        for (const vehicle of vehiclesToMaintain) {
          await this.prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
              status: VehicleStatus.MAINTENANCE,
            },
          });
          this.logger.log(
            `Vehicle ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id}) has been automatically marked as MAINTENANCE due to active blackout date.`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to update vehicles to maintenance status', error);
    }
  }
}
