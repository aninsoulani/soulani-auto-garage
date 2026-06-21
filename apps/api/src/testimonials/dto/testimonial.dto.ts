import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsString()
  @IsOptional()
  authorTitle?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  quoteText: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateTestimonialDto {
  @IsString()
  @IsOptional()
  authorName?: string;

  @IsString()
  @IsOptional()
  authorTitle?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  quoteText?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
