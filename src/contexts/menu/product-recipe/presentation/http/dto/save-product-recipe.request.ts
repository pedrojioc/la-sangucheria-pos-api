import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'

export class ProductRecipeItemRequest {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  @Min(0.001)
  quantity: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string
}

export class SaveProductRecipeRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @ValidateNested({ each: true })
  @Type(() => ProductRecipeItemRequest)
  @IsArray()
  @ArrayMinSize(1)
  items: ProductRecipeItemRequest[]
}
