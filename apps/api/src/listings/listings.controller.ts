import { Controller, Get, Put, Body, Param, Request } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { UpsertSalesListingDto } from './dto/upsert-sales-listing.dto';
import { UpsertRentalListingDto } from './dto/upsert-rental-listing.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('vehicles/:vehicleId')
export class ListingsController {
  constructor(private readonly service: ListingsService) {}

  @Public()
  @Get('sales-listing')
  getSalesListing(@Param('vehicleId') vehicleId: string) {
    return this.service.getSalesListing(+vehicleId);
  }

  @Put('sales-listing')
  upsertSalesListing(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UpsertSalesListingDto,
    @Request() req,
  ) {
    return this.service.upsertSalesListing(+vehicleId, dto, req.user.id);
  }

  @Public()
  @Get('rental-listing')
  getRentalListing(@Param('vehicleId') vehicleId: string) {
    return this.service.getRentalListing(+vehicleId);
  }

  @Put('rental-listing')
  upsertRentalListing(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UpsertRentalListingDto,
    @Request() req,
  ) {
    return this.service.upsertRentalListing(+vehicleId, dto, req.user.id);
  }
}
