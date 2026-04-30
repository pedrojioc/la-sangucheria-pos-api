import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CancelPurchaseOrderItemsRequest {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty({ each: true })
  itemIds: string[]

  @IsString()
  @IsOptional()
  reason?: string | null
}
