import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  IsIn,
  Min,
  MaxLength,
  IsBoolean
} from 'class-validator'
import { Type } from 'class-transformer'
import { InventoryStrategyType } from '../../../domain/inventory-strategy-type'

export class UpdateProductRequest {
  @IsString()
  @MaxLength(100)
  name: string

  @IsUUID()
  categoryId: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number

  @IsOptional()
  @IsIn(['RECIPE', 'DIRECT', 'NONE'])
  inventoryStrategyType?: InventoryStrategyType

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null

  @IsOptional()
  @IsUUID()
  ingredientId?: string | null

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  removeImage?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preparationTime?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
