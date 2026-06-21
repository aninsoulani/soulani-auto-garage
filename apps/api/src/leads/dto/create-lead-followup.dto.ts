import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class CreateLeadFollowupDto {
  @IsString()
  @IsNotEmpty()
  noteText: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;
}
