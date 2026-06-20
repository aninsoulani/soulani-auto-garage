import {
  IsInt,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentalBookingDto {
  @IsInt()
  rentalListingId: number;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsString()
  identityNumber?: string;

  @IsOptional()
  @IsString()
  licenseImageUrl?: string;

  @IsOptional()
  @IsString()
  proofOfTransferUrl?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  paymentMethodId: number;

  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  withDriver?: boolean;
}
