import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpsertRentalListingDto {
  @IsNumber()
  @Min(0)
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
}
