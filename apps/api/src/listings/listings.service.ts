import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSalesListingDto } from './dto/upsert-sales-listing.dto';
import { UpsertRentalListingDto } from './dto/upsert-rental-listing.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async upsertSalesListing(vehicleId: number, dto: UpsertSalesListingDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.salesListing.findUnique({
        where: { vehicleId },
      });

      let listing;
      let action: AuditAction;

      if (existing) {
        listing = await tx.salesListing.update({
          where: { vehicleId },
          data: { ...dto, deletedAt: null },
        });
        action = AuditAction.UPDATE;
      } else {
        listing = await tx.salesListing.create({
          data: { ...dto, vehicleId, createdById: userId },
        });
        action = AuditAction.CREATE;
      }

      await tx.auditLog.create({
        data: {
          userId,
          action,
          moduleName: 'SalesListings',
          recordId: listing.id,
          previousValue: existing ? JSON.parse(JSON.stringify(existing)) : null,
          newValue: JSON.parse(JSON.stringify(listing)),
        },
      });

      return listing;
    });
  }

  async upsertRentalListing(vehicleId: number, dto: UpsertRentalListingDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.rentalListing.findUnique({
        where: { vehicleId },
      });

      let listing;
      let action: AuditAction;

      if (existing) {
        listing = await tx.rentalListing.update({
          where: { vehicleId },
          data: { ...dto, deletedAt: null },
        });
        action = AuditAction.UPDATE;
      } else {
        listing = await tx.rentalListing.create({
          data: { ...dto, vehicleId, createdById: userId },
        });
        action = AuditAction.CREATE;
      }

      await tx.auditLog.create({
        data: {
          userId,
          action,
          moduleName: 'RentalListings',
          recordId: listing.id,
          previousValue: existing ? JSON.parse(JSON.stringify(existing)) : null,
          newValue: JSON.parse(JSON.stringify(listing)),
        },
      });

      return listing;
    });
  }

  async getSalesListing(vehicleId: number) {
    const listing = await this.prisma.salesListing.findFirst({
      where: { vehicleId, deletedAt: null },
    });
    if (!listing) throw new NotFoundException('Sales listing not found');
    return listing;
  }

  async getRentalListing(vehicleId: number) {
    const listing = await this.prisma.rentalListing.findFirst({
      where: { vehicleId, deletedAt: null },
    });
    if (!listing) throw new NotFoundException('Rental listing not found');
    return listing;
  }
}
