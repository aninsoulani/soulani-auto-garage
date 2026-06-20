import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ListingType,
  VehicleStatus,
  TransmissionType,
  FuelType,
  CarType,
  InspectionStatus,
} from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Type(() => Number)
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsNotEmpty({ message: 'Please select a car type.' })
  @IsEnum(CarType, { message: 'Please select a valid car type.' })
  carType: CarType;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  plateNumber?: string;

  @IsString()
  @IsOptional()
  chassisNumber?: string;

  @IsString()
  @IsOptional()
  engineNumber?: string;

  @IsEnum(ListingType)
  listingType: ListingType;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isNewArrival?: boolean;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  mileage: number;

  @IsEnum(TransmissionType)
  @IsOptional()
  transmission?: TransmissionType;

  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @IsString()
  @IsOptional()
  description?: string;

  // Sales Pricing Fields
  @IsNumber() @IsOptional() salesPrice?: number;
  @IsInt() @IsOptional() salesPreviousOwners?: number;

  // Rental Pricing Fields
  @IsNumber() @IsOptional() rentalDailyRate?: number;
  @IsNumber() @IsOptional() rentalDepositAmount?: number;
  @IsBoolean() @IsOptional() rentalIsLongTermEligible?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  rentalIsDriverAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isDriverAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : null))
  @IsNumber()
  rentalDriverFeePerDay?: number | null;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : null))
  @IsNumber()
  driverFeePerDay?: number | null;

  // Inspection Fields
  @IsString() @IsOptional() inspectionDate?: string;
  @IsString() @IsOptional() inspectorName?: string;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionEngineStatus?: InspectionStatus;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionTransmissionStatus?: InspectionStatus;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionSuspensionStatus?: InspectionStatus;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionElectricalStatus?: InspectionStatus;
  @IsEnum(InspectionStatus) @IsOptional() inspectionAcStatus?: InspectionStatus;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionTiresStatus?: InspectionStatus;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionInteriorStatus?: InspectionStatus;
  @IsEnum(InspectionStatus)
  @IsOptional()
  inspectionExteriorStatus?: InspectionStatus;
  @IsString() @IsOptional() inspectionGeneralNotes?: string;
}
