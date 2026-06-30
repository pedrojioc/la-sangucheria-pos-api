import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  IsNotEmpty
} from 'class-validator'

export class UpdateIngredientDto {
  @IsString()
  @MinLength(2, { message: 'El nombre del ingrediente debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre del ingrediente no puede exceder 100 caracteres' })
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string

  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El ID de categoría es obligatorio' })
  ingredientCategoryId: string

  @IsUUID('4', { message: 'El ID de unidad debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El ID de unidad es obligatorio' })
  unitId: string

  @IsOptional()
  @IsUUID('4', { message: 'El ID de proveedor preferido debe ser un UUID v4 válido' })
  preferredSupplierId?: string

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  minimumStock?: number

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El stock máximo no puede ser negativo' })
  maximumStock?: number

  @IsBoolean()
  isPerishable: boolean

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Los días de vida útil no pueden ser negativos' })
  shelfLifeDays?: number

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La ubicación de almacenamiento no puede exceder 100 caracteres' })
  storageLocation?: string

  @IsBoolean()
  isActive: boolean
}
