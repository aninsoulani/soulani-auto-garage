import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Increment viewCount for a vehicle.
   * Uses upsert so the analytics row is created on first view automatically.
   */
  async trackView(vehicleId: number): Promise<{ success: boolean }> {
    // Fire and forget to prevent blocking the request cycle
    (async () => {
      try {
        await this.prisma.vehicleAnalytics.upsert({
          where: { vehicleId },
          create: { vehicleId, viewCount: 1 },
          update: { viewCount: { increment: 1 } },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          // If a concurrent request created the record, fallback to update
          await this.prisma.vehicleAnalytics
            .update({
              where: { vehicleId },
              data: { viewCount: { increment: 1 } },
            })
            .catch((e) => console.error('Analytics fallback error:', e));
        } else {
          console.error('Analytics trackView error:', err);
        }
      }
    })();

    return { success: true };
  }

  /**
   * Get analytics for a single vehicle (admin use).
   */
  async getVehicleAnalytics(vehicleId: number) {
    const analytics = await this.prisma.vehicleAnalytics.findUnique({
      where: { vehicleId },
    });

    return (
      analytics ?? {
        vehicleId,
        viewCount: 0,
        inquiryCount: 0,
        offerCount: 0,
        rentalRequestCount: 0,
      }
    );
  }

  /**
   * Get global dashboard metrics (admin use).
   */
  async getDashboardMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      availableSalesCars,
      soldCars,
      salesRevenueAgg,
      newSalesLeads,
      activeRentals,
      pendingRentalPayments,
      totalRentalVehicles,
      recentBookings,
      recentSalesLeads,
    ] = await Promise.all([
      // Sales metrics
      this.prisma.vehicle.count({
        where: {
          deletedAt: null,
          listingType: { in: ['SALE', 'BOTH'] },
          status: 'ACTIVE',
        },
      }),
      this.prisma.vehicle.count({
        where: { deletedAt: null, status: 'SOLD' },
      }),
      this.prisma.salesListing.aggregate({
        where: { vehicle: { status: 'SOLD', deletedAt: null } },
        _sum: { price: true },
      }),
      this.prisma.lead.count({
        where: {
          deletedAt: null,
          type: { in: ['SALES_INQUIRY', 'MAKE_OFFER', 'TEST_DRIVE_REQUEST'] },
          status: 'NEW',
        },
      }),
      // Rental metrics
      this.prisma.rentalBooking.count({
        where: { deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.rentalBooking.count({
        where: { deletedAt: null, status: 'PENDING_PAYMENT' },
      }),
      this.prisma.vehicle.count({
        where: { deletedAt: null, listingType: { in: ['RENTAL', 'BOTH'] } },
      }),
      // Recent Activities
      this.prisma.rentalBooking.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { rentalListing: { include: { vehicle: true } } },
      }),
      this.prisma.lead.findMany({
        where: {
          deletedAt: null,
          type: { in: ['SALES_INQUIRY', 'MAKE_OFFER'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { vehicle: true },
      }),
    ]);

    const recentRevenueBookings = await this.prisma.rentalBooking.findMany({
      where: {
        deletedAt: null,
        status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { totalPrice: true, createdAt: true },
    });

    const revenueTrend = [
      { name: 'Week 1', revenue: 0 },
      { name: 'Week 2', revenue: 0 },
      { name: 'Week 3', revenue: 0 },
      { name: 'Week 4', revenue: 0 },
    ];

    recentRevenueBookings.forEach((booking) => {
      const daysAgo = Math.floor(
        (new Date().getTime() - new Date(booking.createdAt).getTime()) /
          (1000 * 3600 * 24),
      );
      if (daysAgo <= 7) revenueTrend[3].revenue += Number(booking.totalPrice);
      else if (daysAgo <= 14)
        revenueTrend[2].revenue += Number(booking.totalPrice);
      else if (daysAgo <= 21)
        revenueTrend[1].revenue += Number(booking.totalPrice);
      else revenueTrend[0].revenue += Number(booking.totalPrice);
    });

    const recentActivities = [
      ...recentBookings.map((b) => ({
        id: `rb-${b.id}`,
        type: 'RENTAL' as const,
        referenceCode: b.bookingCode || `RB-${b.id}`,
        customerName: b.customerName,
        vehicleName: b.rentalListing?.vehicle
          ? `${b.rentalListing.vehicle.make} ${b.rentalListing.vehicle.model}`
          : 'Unknown',
        status: b.status,
        date: b.createdAt.toISOString(),
        amount: Number(b.totalPrice),
      })),
      ...recentSalesLeads.map((l) => ({
        id: `sl-${l.id}`,
        type: 'SALE_LEAD' as const,
        referenceCode: l.leadReferenceId || `SL-${l.id}`,
        customerName: l.customerName,
        vehicleName: l.vehicle
          ? `${l.vehicle.make} ${l.vehicle.model}`
          : 'Unknown',
        status: l.status,
        date: l.createdAt.toISOString(),
        amount: undefined,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      sales: {
        availableCars: availableSalesCars,
        soldCars,
        totalRevenue: Number(salesRevenueAgg._sum.price || 0),
        newLeads: newSalesLeads,
      },
      rentals: {
        activeRentals,
        pendingPayments: pendingRentalPayments,
        utilizationRate:
          totalRentalVehicles > 0
            ? Math.round((activeRentals / totalRentalVehicles) * 100)
            : 0,
        revenueTrend,
      },
      recentActivities,
    };
  }
}
