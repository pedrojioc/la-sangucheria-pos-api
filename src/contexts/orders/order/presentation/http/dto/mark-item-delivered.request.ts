import { IsNotEmpty, IsUUID } from 'class-validator'

export class MarkItemDeliveredRequest {
  @IsUUID('4')
  @IsNotEmpty()
  deliveredBy: string
}
