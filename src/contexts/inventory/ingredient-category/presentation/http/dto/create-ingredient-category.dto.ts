import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Matches,
  IsNotEmpty
} from 'class-validator'

export class CreateIngredientCategoryDto {
  @IsUUID('4', { message: 'El ID debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id: string

  @IsString()
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
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe ser un c�digo hexadecimal v�lido (ej: #FF5733)'
  })
  color?: string

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El orden no puede ser negativo' })
  sortOrden?: number

  @IsBoolean()
  isActive: boolean
}
