import { IsOptional, IsEnum, IsInt, Min, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { VehicleStatus, ListingType, TransmissionType, FuelType, CarType } from '@prisma/client';

export class QueryVehicleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsEnum(CarType)
  carType?: CarType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  /** Full-text search on make + model */
  @IsOptional()
  @IsString()
  search?: string;

  /** Filter by featured flag */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  /** Filter by new arrival flag */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isNewArrival?: boolean;

  /** Filter by transmission type */
  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  /** Filter by fuel type */
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  /** Minimum sales price (IDR) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  /** Maximum sales price (IDR) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  /**
   * Sort field and direction.
   * Allowed values: 'newest', 'price:asc', 'price:desc'
   */
  @IsOptional()
  @IsString()
  sort?: string;
}
