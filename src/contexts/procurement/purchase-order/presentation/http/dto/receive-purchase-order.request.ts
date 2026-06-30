import { Type, Transform } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
  ValidateIf
} from 'class-validator'

export class ReceivedItemDto {
  @IsUUID()
  @IsNotEmpty()
  purchaseOrderItemId: string

  /**
   * Si true, el item no llegó. El backend lo marca como cancelado.
   * Cuando notReceived=true, quantityReceived/quantityReceivedUnitId/unitCost son ignorados.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  notReceived?: boolean

  @ValidateIf(o => !o.notReceived)
  @IsNumber()
  @IsPositive()
  quantityReceived: number

  @ValidateIf(o => !o.notReceived)
  @IsUUID()
  @IsNotEmpty()
  quantityReceivedUnitId: string

  @ValidateIf(o => !o.notReceived)
  @IsNumber()
  @IsPositive()
  unitCost: number

  @IsString()
  @IsOptional()
  notes?: string | null
}

export class ReceivePurchaseOrderRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivedItemDto)
  items: ReceivedItemDto[]

  @IsString()
  @IsOptional()
  notes?: string | null

  /**
   * Si es true, cierra la orden después de registrar la recepción.
   * Solo se puede cerrar si todos los items han sido procesados
   * (recibidos o cancelados previamente).
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  closeOrder?: boolean
}
