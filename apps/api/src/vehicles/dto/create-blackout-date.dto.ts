import { IsDateString, IsEnum } from 'class-validator';
import { BlackoutReason } from '@prisma/client';

export class CreateBlackoutDateDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(BlackoutReason)
  reason: BlackoutReason;
}
