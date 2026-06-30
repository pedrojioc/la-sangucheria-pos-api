import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { OrderType } from '../../../domain/order-type'

export class OpenOrderRequest {
  @IsUUID('4')
  @IsNotEmpty()
  id: string

  @IsEnum(OrderType)
  @IsNotEmpty()
  type: OrderType

  @IsUUID('4')
  @IsNotEmpty()
  openedBy: string

  @IsString()
  @IsOptional()
  notes: string | null

  @IsUUID('4')
  @IsOptional()
  tableId?: string | null

  @IsUUID('4')
  @IsOptional()
  customerId?: string | null

  @IsUUID('4')
  @IsOptional()
  addressId?: string | null

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number | null

  @IsString()
  @IsOptional()
  currency?: string
}
