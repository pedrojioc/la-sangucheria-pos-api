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
  ValidateNested
} from 'class-validator'

export class ReceivedItemDto {
  @IsUUID()
  @IsNotEmpty()
  purchaseOrderItemId: string

  @IsNumber()
  @IsPositive()
  quantityReceived: number

  @IsUUID()
  @IsNotEmpty()
  quantityReceivedUnitId: string

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
