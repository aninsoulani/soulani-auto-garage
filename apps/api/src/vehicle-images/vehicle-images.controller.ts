import { Controller, Post, Param, UseInterceptors, UploadedFiles, Request, Patch, Delete } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { VehicleImagesService } from './vehicle-images.service';

const uploadDir = './uploads/vehicles';
const inspectionsDir = './uploads/inspections';
const tempDir = './uploads/temp';

[uploadDir, inspectionsDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

@Controller('vehicles/:vehicleId/images')
export class VehicleImagesController {
  constructor(private readonly vehicleImagesService: VehicleImagesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads/vehicles',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  async uploadImages(
    @Param('vehicleId') vehicleId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    const uploadedImages = await Promise.all(
      files.map(file => this.vehicleImagesService.uploadImage(+vehicleId, file, req.user.id))
    );
    return uploadedImages;
  }

  @Patch(':imageId/primary')
  setPrimary(
    @Param('vehicleId') vehicleId: string,
    @Param('imageId') imageId: string,
    @Request() req
  ) {
    return this.vehicleImagesService.setPrimary(+vehicleId, +imageId, req.user.id);
  }

  @Delete(':imageId')
  removeImage(
    @Param('vehicleId') vehicleId: string,
    @Param('imageId') imageId: string,
    @Request() req
  ) {
    return this.vehicleImagesService.removeImage(+vehicleId, +imageId, req.user.id);
  }
}
