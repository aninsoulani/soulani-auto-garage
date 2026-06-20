import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { Public } from '../common/decorators/public.decorator';

const licensesDir = './uploads/licenses';
if (!fs.existsSync(licensesDir)) {
  fs.mkdirSync(licensesDir, { recursive: true });
}
const receiptsDir = './uploads/receipts';
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
  @Public()
  @Post('license')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: licensesDir,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `license-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadLicense(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      filePath: file.path,
      fileUrl: `/uploads/licenses/${file.filename}`,
    };
  }

  @Public()
  @Post('receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: receiptsDir,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `receipt-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      filePath: file.path,
      fileUrl: `/uploads/receipts/${file.filename}`,
    };
  }
}
