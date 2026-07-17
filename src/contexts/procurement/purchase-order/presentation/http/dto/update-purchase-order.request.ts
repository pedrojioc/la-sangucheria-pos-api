import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsISO8601,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for individual items in the purchase order
 */
export class UpdatePurchaseOrderItemDto {
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
 * DTO for updating a purchase order (only in DRAFT status)
 *
 * The frontend sends the complete state of the order:
 * - General order data (optional fields)
 * - Complete array of items that should exist in the order
 *
 * The backend will automatically:
 * - Add new items (items with IDs not in the current order)
 * - Remove deleted items (current items not present in the new array)
 * - Keep existing items (items with IDs that match)
 */
export class UpdatePurchaseOrderRequest {
  @IsString()
  @IsNotEmpty()
  @IsIn(['COP', 'USD', 'MXN'])
  currency: string

  @IsUUID()
  @IsOptional()
  supplierId?: string

  @IsISO8601()
  @IsOptional()
  expectedDeliveryDate?: string | null

  @IsString()
  @IsOptional()
  notes?: string | null

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  items?: UpdatePurchaseOrderItemDto[]
}
