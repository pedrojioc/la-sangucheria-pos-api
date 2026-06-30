import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import { TableShape } from '../../../domain/table-shape'

export class UpdateTableRequest {
  @IsString()
  @IsNotEmpty({ message: 'El número de mesa es obligatorio' })
  @MinLength(1)
  @MaxLength(20, { message: 'El número de mesa no puede exceder 20 caracteres' })
  number: string

  @IsInt({ message: 'La capacidad debe ser un número entero' })
  @Min(1, { message: 'La capacidad debe ser al menos 1' })
  capacity: number

  @IsEnum(TableShape, { message: 'La forma debe ser RECTANGLE, ROUND o SQUARE' })
  @IsNotEmpty({ message: 'La forma de la mesa es obligatoria' })
  shape: TableShape

  @IsUUID('4', { message: 'El zoneId debe ser un UUID v4 válido' })
  @IsOptional()
  zoneId?: string | null

  @IsNumber({}, { message: 'positionX debe ser un número' })
  @Min(0, { message: 'positionX debe ser 0 o mayor' })
  @Max(100, { message: 'positionX no puede exceder 100' })
  @IsOptional()
  positionX?: number | null

  @IsNumber({}, { message: 'positionY debe ser un número' })
  @Min(0, { message: 'positionY debe ser 0 o mayor' })
  @Max(100, { message: 'positionY no puede exceder 100' })
  @IsOptional()
  positionY?: number | null

  @IsInt({ message: 'La rotación debe ser un número entero' })
  @Min(0, { message: 'La rotación debe ser 0 o mayor' })
  @Max(359, { message: 'La rotación no puede exceder 359' })
  @IsOptional()
  rotation?: number
}
