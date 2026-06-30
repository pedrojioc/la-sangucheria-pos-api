import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Matches,
  IsNotEmpty
} from 'class-validator'

export class UpdateIngredientCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre de la categoría debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la categoría no puede exceder 100 caracteres' })
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El ícono no puede exceder 50 caracteres' })
  icon?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El orden no puede ser negativo' })
  sortOrder?: number

  @IsBoolean()
  isActive: boolean
}
