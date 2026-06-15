import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { promises as fs } from 'fs';

@Injectable()
export class VehicleImagesService {
  private readonly logger = new Logger(VehicleImagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async uploadImage(vehicleId: number, file: Express.Multer.File, userId: number) {
    const fileUrl = `/uploads/vehicles/${file.filename}`;
    const filePath = file.path;

    return this.prisma.$transaction(async (tx) => {
      const existingImages = await tx.vehicleImage.count({
        where: { vehicleId },
      });

      const isPrimary = existingImages === 0; // First image is primary by default

      const vehicleImage = await tx.vehicleImage.create({
        data: {
          vehicleId,
          fileUrl,
          filePath,
          isPrimary,
          sortOrder: existingImages,
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          moduleName: 'VehicleImages',
          recordId: vehicleImage.id,
          newValue: JSON.parse(JSON.stringify(vehicleImage)),
        },
      });

      return vehicleImage;
    });
  }

  async setPrimary(vehicleId: number, imageId: number, userId: number) {
    const existing = await this.prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId },
    });

    if (!existing) {
      throw new NotFoundException(`Image with ID ${imageId} not found for vehicle ${vehicleId}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Unset all existing primary images for this vehicle
      await tx.vehicleImage.updateMany({
        where: { vehicleId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Set the new primary image
      const vehicleImage = await tx.vehicleImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          moduleName: 'VehicleImages',
          recordId: vehicleImage.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
          newValue: JSON.parse(JSON.stringify(vehicleImage)),
        },
      });

      return vehicleImage;
    });
  }

  async removeImage(vehicleId: number, imageId: number, userId: number) {
    const existing = await this.prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId },
    });

    if (!existing) {
      throw new NotFoundException(`Image with ID ${imageId} not found for vehicle ${vehicleId}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const vehicleImage = await tx.vehicleImage.delete({
        where: { id: imageId },
      });

      // If we deleted the primary image, we should try to assign a new one
      if (existing.isPrimary) {
        const nextImage = await tx.vehicleImage.findFirst({
          where: { vehicleId },
          orderBy: { sortOrder: 'asc' },
        });

        if (nextImage) {
          await tx.vehicleImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.DELETE,
          moduleName: 'VehicleImages',
          recordId: vehicleImage.id,
          previousValue: JSON.parse(JSON.stringify(existing)),
        },
      });

      return vehicleImage;
    });

    // Asynchronous physical file cleanup
    fs.unlink(existing.filePath).catch((err) => {
      this.logger.error(`Failed to delete physical file for image ${imageId} at ${existing.filePath}`, err.stack);
    });

    return result;
  }

  async reorderImages(vehicleId: number, imageIds: number[], userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const updates = imageIds.map((id, index) => 
        tx.vehicleImage.updateMany({
          where: { id, vehicleId },
          data: { sortOrder: index }
        })
      );
      
      await Promise.all(updates);
      
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          moduleName: 'VehicleImages',
          recordId: vehicleId,
          newValue: { message: `Reordered ${imageIds.length} images`, imageIds },
        },
      });

      return { success: true, message: 'Images reordered successfully' };
    });
  }
}
