import {
  IsString,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max
} from 'class-validator'
import { Type } from 'class-transformer'

class AdditionalIngredientDto {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  @Min(0)
  quantityPerUnit: number
}

export class UpdatePreparationRecipeRequest {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsNumber()
  @Min(0)
  @Max(100)
  yieldPercentage: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalIngredientDto)
  additionalIngredients: AdditionalIngredientDto[]

  @IsString()
  @IsOptional()
  description?: string | null

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  yieldTolerancePercentage?: number | null
}
