import { IsString, IsOptional } from 'class-validator'

export class RejectPurchaseOrderRequest {
  @IsString()
  @IsOptional()
  reason?: string
}
