import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CancelPurchaseOrderItemsRequest {
  @IsUUID()
  @IsNotEmpty()
  itemId: string

  @IsString()
  @IsOptional()
  reason?: string | null
}
