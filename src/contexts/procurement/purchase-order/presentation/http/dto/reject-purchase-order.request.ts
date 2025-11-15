import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator'

export class RejectPurchaseOrderRequest {
  @IsUUID()
  @IsNotEmpty()
  rejectedBy: string

  @IsString()
  @IsOptional()
  reason?: string
}
