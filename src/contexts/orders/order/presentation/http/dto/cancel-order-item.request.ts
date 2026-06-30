import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CancelOrderItemRequest {
  @IsString()
  @IsNotEmpty()
  reason: string

  @IsUUID('4')
  @IsNotEmpty()
  cancelledBy: string
}
