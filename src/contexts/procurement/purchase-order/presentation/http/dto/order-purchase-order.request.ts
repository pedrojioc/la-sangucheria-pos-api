import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator'
import { PurchaseMethod } from '../../../domain/purchase-method'

export class OrderPurchaseOrderRequest {
  @IsEnum(PurchaseMethod)
  @IsNotEmpty()
  purchaseMethod: PurchaseMethod

  @IsString()
  @IsOptional()
  purchaseMethodDetails?: string | null
}
