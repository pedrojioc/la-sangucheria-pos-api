import {
  IsString,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max
} from 'class-validator'
import { Type } from 'class-transformer'

class AdditionalIngredientDto {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  @Min(0)
  quantityPerUnit: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string
}

class IngredientDataDto {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string | null

  @IsUUID()
  @IsNotEmpty()
  categoryId: string

  @IsUUID()
  @IsNotEmpty()
  unitId: string

  @IsUUID()
  @IsOptional()
  preferredSupplierId?: string | null

  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumStock?: number | null

  @IsNumber()
  @IsOptional()
  @Min(0)
  maximumStock?: number | null

  @IsBoolean()
  isPerishable: boolean

  @IsNumber()
  @IsOptional()
  @Min(1)
  shelfLifeDays?: number | null

  @IsString()
  @IsOptional()
  storageLocation?: string | null

  @IsBoolean()
  isActive: boolean
}

/**
 * DTO for creating a preparation recipe with ingredients (bulk/orchestration endpoint)
 *
 * Use this when you need to create the ingredients along with the recipe.
 * This is a convenience endpoint that orchestrates multiple operations.
 *
 * Endpoint: POST /preparation-recipes/bulk
 *
 * @example
 * {
 *   "recipeId": "uuid",
 *   "recipeName": "Cook and Shred Chicken",
 *   "createBaseIngredient": false,  // Use existing raw chicken
 *   "baseIngredientId": "existing-uuid",
 *   "outputIngredientId": "new-uuid",
 *   "outputIngredientData": {
 *     "name": "Cooked Shredded Chicken",
 *     "categoryId": "meat-uuid",
 *     ...
 *   },
 *   "yieldPercentage": 85,
 *   "additionalIngredients": [
 *     { "ingredientId": "salt-uuid", "quantityPerUnit": 5, "unitId": "g-uuid" }
 *   ]
 * }
 */
export class CreatePreparationRecipeBulkRequest {
  // Recipe data
  @IsUUID()
  @IsNotEmpty()
  recipeId: string

  @IsString()
  @IsNotEmpty()
  recipeName: string

  @IsString()
  @IsOptional()
  recipeDescription?: string | null

  @IsUUID()
  @IsNotEmpty()
  baseIngredientId: string

  // Output ingredient (always created)
  @IsUUID()
  @IsNotEmpty()
  outputIngredientId: string

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IngredientDataDto)
  outputIngredientData: IngredientDataDto

  // Recipe transformation
  @IsNumber()
  @Min(0)
  @Max(100)
  yieldPercentage: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalIngredientDto)
  additionalIngredients: AdditionalIngredientDto[]
}
