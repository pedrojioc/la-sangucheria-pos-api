import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CancelOrderRequest {
  @IsString()
  @IsNotEmpty()
  reason: string

  @IsUUID('4')
  @IsNotEmpty()
  cancelledBy: string
}
