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
      availableVehicles,
      soldVehicles,
      rentedVehicles,
      featuredVehicles,
      newArrivals,
      typeDistributionRaw,
      carTypeDistributionRaw,
      recentLeads,
      leadStatusRaw
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { deletedAt: null } }),
      this.prisma.vehicle.count({ where: { status: 'AVAILABLE', deletedAt: null } }),
      this.prisma.vehicle.count({ where: { status: 'SOLD', deletedAt: null } }),
      this.prisma.vehicle.count({ where: { status: 'RENTED', deletedAt: null } }),
      this.prisma.vehicle.count({ where: { isFeatured: true, deletedAt: null } }),
      this.prisma.vehicle.count({ where: { isNewArrival: true, deletedAt: null } }),
      this.prisma.vehicle.groupBy({ by: ['listingType'], _count: { listingType: true }, where: { deletedAt: null } }),
      this.prisma.vehicle.groupBy({ by: ['carType'], _count: { carType: true }, where: { deletedAt: null } }),
      this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { vehicle: { select: { make: true, model: true } } } }),
      this.prisma.lead.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const listingTypeDistribution = typeDistributionRaw.reduce((acc, curr) => { acc[curr.listingType] = curr._count.listingType; return acc; }, {} as Record<string, number>);
    const carTypeDistribution = carTypeDistributionRaw.reduce((acc, curr) => { acc[curr.carType] = curr._count.carType; return acc; }, {} as Record<string, number>);
    const leadStatusDistribution = leadStatusRaw.reduce((acc, curr) => { acc[curr.status] = curr._count.status; return acc; }, {} as Record<string, number>);

    return {
      totalVehicles,
      availableVehicles,
      soldVehicles,
      rentedVehicles,
      featuredVehicles,
      newArrivals,
      listingTypeDistribution,
      carTypeDistribution,
      recentLeads,
      leadStatusDistribution,
    };
  }
}
