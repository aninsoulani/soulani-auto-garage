import { Module } from '@nestjs/common';
import { VehicleImagesService } from './vehicle-images.service';
import { VehicleImagesController } from './vehicle-images.controller';

@Module({
  controllers: [VehicleImagesController],
  providers: [VehicleImagesService],
  exports: [VehicleImagesService],
})
export class VehicleImagesModule {}
