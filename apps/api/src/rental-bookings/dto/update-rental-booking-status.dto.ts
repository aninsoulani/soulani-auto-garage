import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateRentalBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
