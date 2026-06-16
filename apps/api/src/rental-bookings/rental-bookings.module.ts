import { Module } from '@nestjs/common';
import { RentalBookingsService } from './rental-bookings.service';
import { RentalBookingsController } from './rental-bookings.controller';

@Module({
  providers: [RentalBookingsService],
  controllers: [RentalBookingsController]
})
export class RentalBookingsModule {}
