import { IsUUID, IsNotEmpty } from 'class-validator'

export class SendPurchaseOrderRequest {
  @IsUUID()
  @IsNotEmpty()
  sentBy: string
}
