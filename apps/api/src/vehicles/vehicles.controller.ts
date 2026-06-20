import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/vehicles',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|jfif)$/i)) {
          return cb(
            new BadRequestException(
              'Only image files (JPG, PNG, WebP, JFIF) are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  create(
    @Body('data') dataString: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one vehicle image is required.');
    }
    let createVehicleDto: CreateVehicleDto;
    try {
      createVehicleDto = JSON.parse(dataString);
    } catch (err) {
      throw new BadRequestException('Invalid JSON data payload');
    }

    if (!createVehicleDto.inspectionDate || !createVehicleDto.inspectorName) {
      throw new BadRequestException(
        'Inspection date and inspector name are required.',
      );
    }
    return this.vehiclesService.create(createVehicleDto, files, req.user.id);
  }

  @Public()
  @Get()
  findAllPublic(@Query() query: QueryVehicleDto) {
    // Public queries explicitly exclude MAINTENANCE (handled in service)
    return this.vehiclesService.findAll(query, false);
  }

  @Get('admin/list')
  findAdminAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query, true);
  }

  /**
   * Public endpoint: look up a vehicle by its slug.
   * IMPORTANT: This route MUST be declared before `@Get(':id')` so that
   * the literal segment "by-slug" is not mistakenly parsed as a numeric ID.
   */
  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.vehiclesService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(+id);
  }

  @Public()
  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.vehiclesService.getAvailability(+id);
  }

  @Get(':id/blackout-dates')
  getBlackoutDates(@Param('id') id: string) {
    return this.vehiclesService.getBlackoutDates(+id);
  }

  @Post(':id/blackout-dates')
  addBlackoutDate(
    @Param('id') id: string,
    @Body() createDto: CreateBlackoutDateDto,
    @Request() req,
  ) {
    return this.vehiclesService.addBlackoutDate(+id, createDto, req.user.id);
  }

  @Delete(':id/blackout-dates/:dateId')
  removeBlackoutDate(
    @Param('id') id: string,
    @Param('dateId') dateId: string,
    @Request() req,
  ) {
    return this.vehiclesService.removeBlackoutDate(+id, +dateId, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Request() req,
  ) {
    return this.vehiclesService.update(+id, updateVehicleDto, req.user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.vehiclesService.publishVehicle(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.remove(+id, req.user.id);
  }
}
