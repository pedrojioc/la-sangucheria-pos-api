import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateOrderItemRequest {
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number

  @IsString()
  @IsOptional()
  notes?: string | null
}
