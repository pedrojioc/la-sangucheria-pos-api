import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'

export class RecipeItemDto {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  @Min(0.01)
  quantity: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string
}

export class RecipeYieldDto {
  @IsNumber()
  @Min(0.01)
  value: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string
}

export class CreateRecipeRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

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
