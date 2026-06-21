import { IsArray, IsNumber, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class BulkAssignLeadsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  leadIds: number[];

  @IsNumber()
  @IsNotEmpty()
  assignedToId: number;
}
