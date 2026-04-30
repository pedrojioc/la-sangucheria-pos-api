import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { MovementType } from '../../../domain/movement-type'

/**
 * Tipos de movimiento permitidos desde el frontend para ajustes manuales.
 * Solo movimientos de deducción — toda entrada debe pasar por una recepción de OC.
 *
 * - ADJUSTMENT: Ajuste por conteo físico (disminuye)
 * - WASTE: Merma o desperdicio (disminuye)
 *
 * La unidad de medida se toma del nivel de inventario existente del ingrediente.
 */
export type ManualAdjustmentType = MovementType.ADJUSTMENT | MovementType.WASTE

const ALLOWED_TYPES = [MovementType.ADJUSTMENT, MovementType.WASTE]

export class RegisterManualAdjustmentRequest {
  @IsEnum(ALLOWED_TYPES, {
    message: `type must be one of: ${ALLOWED_TYPES.join(', ')}`
  })
  type!: ManualAdjustmentType

  @IsNumber()
  @Min(0.0001, { message: 'quantity must be greater than 0' })
  @Type(() => Number)
  quantity!: number

  @IsOptional()
  @IsString()
  note?: string
}
