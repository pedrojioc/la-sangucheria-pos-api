import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator'

export class UpdateZoneRequest {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la zona es obligatorio' })
  @MinLength(1)
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string

  @IsString()
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @MaxLength(20, { message: 'El color no puede exceder 20 caracteres' })
  color: string

  @IsInt({ message: 'El índice de orden debe ser un entero' })
  @Min(0, { message: 'El índice de orden debe ser 0 o mayor' })
  sortIndex: number

  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive: boolean
}
