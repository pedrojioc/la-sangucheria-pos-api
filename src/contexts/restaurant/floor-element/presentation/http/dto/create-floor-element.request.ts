import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from 'class-validator'
import { FloorElementType } from '../../../domain/floor-element-type'

export class CreateFloorElementRequest {
  @IsUUID('4', { message: 'El ID debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id: string

  @IsUUID('4', { message: 'El zoneId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El zoneId es obligatorio' })
  zoneId: string

  @IsEnum(FloorElementType, { message: 'Tipo de elemento no válido' })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  type: FloorElementType

  @IsString()
  @MaxLength(100, { message: 'El label no puede exceder 100 caracteres' })
  @IsOptional()
  label?: string | null

  @IsNumber({}, { message: 'positionX debe ser un número' })
  @Min(0)
  @Max(100)
  positionX: number

  @IsNumber({}, { message: 'positionY debe ser un número' })
  @Min(0)
  @Max(100)
  positionY: number

  @IsNumber({}, { message: 'width debe ser un número' })
  @Min(0.01)
  @Max(100)
  width: number

  @IsNumber({}, { message: 'height debe ser un número' })
  @Min(0.01)
  @Max(100)
  height: number

  @IsInt({ message: 'rotation debe ser un entero' })
  @Min(0)
  @Max(359)
  @IsOptional()
  rotation?: number

  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string | null
}
