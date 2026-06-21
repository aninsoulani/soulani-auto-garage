import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignLeadDto {
  @IsNumber()
  @IsNotEmpty()
  assignedToId: number;
}
