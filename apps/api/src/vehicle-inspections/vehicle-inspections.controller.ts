import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { VehicleInspectionsService } from './vehicle-inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';

@Controller('vehicles/:vehicleId/inspections')
export class VehicleInspectionsController {
  constructor(private readonly service: VehicleInspectionsService) {}

  @Post()
  create(@Param('vehicleId') vehicleId: string, @Body() dto: CreateInspectionDto, @Request() req) {
    return this.service.create(+vehicleId, dto, req.user.id);
  }

  @Get()
  findAll(@Param('vehicleId') vehicleId: string) {
    return this.service.findAll(+vehicleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('vehicleId') vehicleId: string) {
    return this.service.findOne(+id, +vehicleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Param('vehicleId') vehicleId: string, @Body() dto: UpdateInspectionDto, @Request() req) {
    return this.service.update(+id, +vehicleId, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Param('vehicleId') vehicleId: string, @Request() req) {
    return this.service.remove(+id, +vehicleId, req.user.id);
  }
}
