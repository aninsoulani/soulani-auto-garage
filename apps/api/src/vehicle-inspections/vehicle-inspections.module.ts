import { Module } from '@nestjs/common';
import { VehicleInspectionsService } from './vehicle-inspections.service';
import { VehicleInspectionsController } from './vehicle-inspections.controller';

@Module({
  controllers: [VehicleInspectionsController],
  providers: [VehicleInspectionsService],
  exports: [VehicleInspectionsService],
})
export class VehicleInspectionsModule {}
