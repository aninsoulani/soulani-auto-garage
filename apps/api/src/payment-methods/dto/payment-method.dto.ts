import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePaymentMethodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
