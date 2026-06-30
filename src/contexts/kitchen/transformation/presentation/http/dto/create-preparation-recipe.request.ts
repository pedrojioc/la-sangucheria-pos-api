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

/**
 * DTO for creating a preparation recipe (simple endpoint)
 *
 * Use this when all ingredients (base and output) already exist in the system.
 * This is the standard endpoint for creating preparation recipes.
 *
 * Endpoint: POST /preparation-recipes
 */
export class CreatePreparationRecipeRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsUUID()
  @IsNotEmpty()
  baseIngredientId: string

  @IsUUID()
  @IsNotEmpty()
  outputIngredientId: string

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
