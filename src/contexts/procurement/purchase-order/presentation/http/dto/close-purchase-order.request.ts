import { IsUUID, IsNotEmpty } from 'class-validator'

export class ClosePurchaseOrderRequest {
  @IsUUID()
  @IsNotEmpty()
  closedBy: string
}
