import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
