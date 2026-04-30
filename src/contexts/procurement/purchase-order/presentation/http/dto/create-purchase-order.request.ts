import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsISO8601,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  IsPositive
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for individual items in a purchase order
 */
export class CreatePurchaseOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsString()
  @IsNotEmpty()
  ingredientName: string

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
  @IsOptional()
  notes?: string
}

/**
 * DTO for creating a purchase order with initial items
 */
export class CreatePurchaseOrderRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsUUID()
  @IsNotEmpty()
  supplierId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[]

  @IsISO8601()
  requestedDate?: string

  @IsISO8601()
  @IsOptional()
  expectedDeliveryDate?: string

  @IsString()
  @IsOptional()
  notes?: string
}
