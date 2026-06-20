import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpsertRentalListingDto {
  @IsNumber()
  @Min(1)
  dailyRate: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weeklyRate?: number;

  @IsNumber()
  @Min(0)
  depositAmount: number;

  @IsBoolean()
  @IsOptional()
  isLongTermEligible?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isDriverAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : null))
  @IsNumber()
  driverFeePerDay?: number | null;
}
