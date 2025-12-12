import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'
import { RecipeItemDto, RecipeYieldDto } from './create-recipe.request'

export class UpdateRecipeRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string

  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  @IsArray()
  @ArrayMinSize(1)
  items: RecipeItemDto[]

  @ValidateNested()
  @Type(() => RecipeYieldDto)
  @IsNotEmpty()
  recipeYield: RecipeYieldDto
}
