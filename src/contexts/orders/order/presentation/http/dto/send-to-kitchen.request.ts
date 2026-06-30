import { IsArray, IsNotEmpty, IsUUID } from 'class-validator'

export class SendToKitchenRequest {
  @IsUUID('4')
  @IsNotEmpty()
  ticketId: string

  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[]

  @IsUUID('4')
  @IsNotEmpty()
  sentBy: string
}
