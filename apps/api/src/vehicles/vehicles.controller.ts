import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @SkipThrottle()
  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto, @Request() req) {
    return this.vehiclesService.create(createVehicleDto, req.user.id);
  }

  @Public()
  @Throttle({ short: { limit: 1000, ttl: 60000 }, medium: { limit: 10000, ttl: 3600000 } })
  @Get()
  findAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query);
  }

  /**
   * Public endpoint: look up a vehicle by its slug.
   * IMPORTANT: This route MUST be declared before `@Get(':id')` so that
   * the literal segment "by-slug" is not mistakenly parsed as a numeric ID.
   */
  @Public()
  @Throttle({ short: { limit: 1000, ttl: 60000 }, medium: { limit: 10000, ttl: 3600000 } })
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.vehiclesService.findBySlug(slug);
  }

  @Public()
  @Throttle({ short: { limit: 1000, ttl: 60000 }, medium: { limit: 10000, ttl: 3600000 } })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(+id);
  }

  @SkipThrottle()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto, @Request() req) {
    return this.vehiclesService.update(+id, updateVehicleDto, req.user.id);
  }

  @SkipThrottle()
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.remove(+id, req.user.id);
  }
}
