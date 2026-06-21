import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
  Matches,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadType, LeadSource } from '@prisma/client';

export class CreateLeadDto {
  @IsNumber()
  @Type(() => Number)
  vehicleId: number;

  @IsEnum(LeadType)
  type: LeadType;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  customerName: string;

  /**
   * Indonesian phone number.
   * Accepts formats: +62xxx, 08xxx, 62xxx
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, {
    message: 'customerPhone must be a valid Indonesian phone number',
  })
  customerPhone: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  /**
   * Required only when type === MAKE_OFFER.
   * Must be a positive decimal (IDR amount).
   */
  @ValidateIf((o) => o.type === LeadType.MAKE_OFFER)
  @IsNotEmpty({
    message: 'offeredPrice is required when inquiry type is Make Offer',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  offeredPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;
}
