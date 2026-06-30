import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator'

class OptionItemRequest {
  @IsUUID()
  id: string

  @IsString()
  @MaxLength(100)
  label: string

  @IsUUID()
  ingredientId: string

  @IsNumber()
  @Min(0)
  quantity: number

  @IsUUID()
  unitId: string

  @IsNumber()
  @Min(0)
  extraPrice: number

  @IsInt()
  @Min(0)
  sortOrder: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class CreateOptionGroupRequest {
  @IsUUID()
  id: string

  @IsString()
  @MaxLength(100)
  name: string

  @IsEnum(['SWAP', 'ADD'])
  type: 'SWAP' | 'ADD'

  @IsBoolean()
  required: boolean

  @IsInt()
  @Min(0)
  minSelections: number

  @IsInt()
  @Min(1)
  maxSelections: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionItemRequest)
  items: OptionItemRequest[]
}
