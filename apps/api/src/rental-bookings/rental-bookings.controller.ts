import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { getThrottlerConfig } from '../config/throttler.config';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { RentalBookingsService } from './rental-bookings.service';
import { CreateRentalBookingDto } from './dto/create-rental-booking.dto';
import { UpdateRentalBookingStatusDto } from './dto/update-rental-booking-status.dto';
import { QueryRentalBookingDto } from './dto/query-rental-booking.dto';
import { Public } from '../common/decorators/public.decorator';

const receiptsDir = './uploads/receipts';
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}
const licensesDir = './uploads/licenses';
if (!fs.existsSync(licensesDir)) {
  fs.mkdirSync(licensesDir, { recursive: true });
}

@Controller('rental-bookings')
export class RentalBookingsController {
  constructor(private readonly bookingsService: RentalBookingsService) {}

  @Public()
  @Throttle({ default: getThrottlerConfig().mutate })
  @Post()
  create(@Body() createDto: CreateRentalBookingDto, @Request() req) {
    // Optionally capture user.id if logged in, else null for guest checkout
    const userId = req.user?.id;
    return this.bookingsService.create(createDto, userId);
  }

  @Get()
  findAll(@Query() query: QueryRentalBookingDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateRentalBookingStatusDto,
    @Request() req,
  ) {
    return this.bookingsService.updateStatus(+id, updateDto, req.user.id);
  }

  @Public() // Allow guests to upload receipts
  @Throttle({ default: getThrottlerConfig().mutate })
  @Post(':id/receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: receiptsDir,
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
  uploadReceipt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const userId = req.user?.id;
    return this.bookingsService.uploadReceipt(+id, file, userId);
  }

  @Patch(':id/paperwork')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'license', maxCount: 1 },
        { name: 'proofOfTransfer', maxCount: 1 },
        { name: 'ktp', maxCount: 1 },
        { name: 'sim', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const dest = file.fieldname === 'proofOfTransfer' ? receiptsDir : licensesDir;
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|jfif)$/i)) {
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
      },
    ),
  )
  updatePaperwork(
    @Param('id') id: string,
    @Body('identityNumber') identityNumber: string,
    @UploadedFiles()
    files: {
      license?: Express.Multer.File[];
      proofOfTransfer?: Express.Multer.File[];
      ktp?: Express.Multer.File[];
      sim?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.bookingsService.updatePaperwork(
      +id,
      files,
      identityNumber,
      userId,
    );
  }
}
