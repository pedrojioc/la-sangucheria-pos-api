import { IsUUID, IsNotEmpty } from 'class-validator'

export class ApprovePurchaseOrderRequest {
  @IsUUID()
  @IsNotEmpty()
  approvedBy: string
}
