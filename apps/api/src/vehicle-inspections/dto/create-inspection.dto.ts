import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { InspectionStatus } from '@prisma/client';

export class CreateInspectionDto {
  @IsDateString()
  inspectionDate: string;

  @IsString()
  @IsNotEmpty()
  inspectorName: string;

  @IsEnum(InspectionStatus)
  engineStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  transmissionStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  suspensionStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  electricalStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  acStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  tiresStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  interiorStatus: InspectionStatus;

  @IsEnum(InspectionStatus)
  exteriorStatus: InspectionStatus;

  @IsString()
  @IsOptional()
  generalNotes?: string;
}
