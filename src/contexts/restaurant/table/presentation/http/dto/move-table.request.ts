import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'

export class MoveTableRequest {
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
