import { IsString, IsUUID, IsNotEmpty, IsNumber, IsPositive, IsOptional, MaxLength } from 'class-validator'

export class AddItemToPurchaseOrderRequest {
  @IsUUID()
  @IsNotEmpty()
  itemId: string

  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  @IsPositive()
  quantityRequested: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string

  @IsNumber()
  @IsPositive()
  unitCost: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string

  @IsString()
  @IsOptional()
  notes?: string
}
