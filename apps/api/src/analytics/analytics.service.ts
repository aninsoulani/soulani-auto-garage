import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Increment viewCount for a vehicle.
   * Uses upsert so the analytics row is created on first view automatically.
   */
  async trackView(vehicleId: number): Promise<{ success: boolean }> {
    await this.prisma.vehicleAnalytics.upsert({
      where: { vehicleId },
      create: { vehicleId, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });

    return { success: true };
  }

  /**
   * Get analytics for a single vehicle (admin use).
   */
  async getVehicleAnalytics(vehicleId: number) {
    const analytics = await this.prisma.vehicleAnalytics.findUnique({
      where: { vehicleId },
    });

    return analytics ?? {
      vehicleId,
      viewCount: 0,
      inquiryCount: 0,
      offerCount: 0,
      rentalRequestCount: 0,
    };
  }

  /**
   * Get global dashboard metrics (admin use).
   */
  async getDashboardMetrics() {
    const [
      totalVehicles,
      activeRentals,
      newLeads
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { deletedAt: null, status: 'AVAILABLE' } }),
      this.prisma.rentalBooking.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.lead.count({ where: { deletedAt: null, status: 'NEW' } }),
    ]);

    return {
      totalVehicles,
      activeRentals,
      newLeads,
    };
  }
}
