import { IsUUID, IsNotEmpty, IsNumber, IsPositive } from 'class-validator'

export class RegisterItemReceptionRequest {
  @IsUUID()
  @IsNotEmpty()
  itemId: string

  @IsNumber()
  @IsPositive()
  quantityReceived: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string
}
