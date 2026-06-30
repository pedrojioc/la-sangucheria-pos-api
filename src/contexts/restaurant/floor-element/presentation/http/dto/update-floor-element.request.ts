import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min
} from 'class-validator'
import { FloorElementType } from '../../../domain/floor-element-type'

export class UpdateFloorElementRequest {
  @IsEnum(FloorElementType, { message: 'Tipo de elemento no válido' })
  @IsOptional()
  type?: FloorElementType

  @IsString()
  @MaxLength(100)
  @IsOptional()
  label?: string | null

  @IsNumber({}, { message: 'positionX debe ser un número' })
  @Min(0)
  @Max(100)
  @IsOptional()
  positionX?: number

  @IsNumber({}, { message: 'positionY debe ser un número' })
  @Min(0)
  @Max(100)
  @IsOptional()
  positionY?: number

  @IsNumber({}, { message: 'width debe ser un número' })
  @Min(0.01)
  @Max(100)
  @IsOptional()
  width?: number

  @IsNumber({}, { message: 'height debe ser un número' })
  @Min(0.01)
  @Max(100)
  @IsOptional()
  height?: number

  @IsInt()
  @Min(0)
  @Max(359)
  @IsOptional()
  rotation?: number

  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string | null

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
