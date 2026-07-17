import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

class ModifierDto {
  @IsUUID('4')
  optionGroupId: string

  @IsString()
  @IsNotEmpty()
  optionGroupName: string

  @IsUUID('4')
  optionItemId: string

  @IsString()
  @IsNotEmpty()
  optionItemName: string

  @IsNumber()
  priceAdjustment: number

  @IsString()
  @IsOptional()
  @IsIn(['COP', 'USD', 'MXN'])
  currency?: string
}

class OrderItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string

  @IsUUID('4')
  @IsNotEmpty()
  productId: string

  @IsString()
  @IsNotEmpty()
  productName: string

  @IsNumber()
  @Min(0)
  unitPrice: number

  @IsString()
  @IsOptional()
  @IsIn(['COP', 'USD', 'MXN'])
  currency?: string

  @IsNumber()
  @Min(1)
  quantity: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierDto)
  @IsOptional()
  modifiers?: ModifierDto[]

  @IsString()
  @IsOptional()
  notes?: string | null
}

export class AddOrderItemsRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
