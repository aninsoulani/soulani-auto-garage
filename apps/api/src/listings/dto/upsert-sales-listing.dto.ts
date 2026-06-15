import { IsNumber, IsInt, Min } from 'class-validator';

export class UpsertSalesListingDto {
  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  previousOwners: number;
}
