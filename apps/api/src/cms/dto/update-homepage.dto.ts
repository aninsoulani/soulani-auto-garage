import { IsObject, IsNotEmpty } from 'class-validator';

export class UpdateHomepageDto {
  @IsObject()
  @IsNotEmpty()
  data: any;
}
