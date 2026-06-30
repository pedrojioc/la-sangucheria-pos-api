import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested
} from 'class-validator'

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER'

export class PaymentDto {
  @IsEnum(['CASH', 'CARD', 'TRANSFER'])
  @IsNotEmpty()
  method: PaymentMethod

  @IsNumber()
  @IsPositive()
  amount: number
}

export class SplitDto {
  @IsString()
  @IsNotEmpty()
  label: string

  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[]

  @ValidateNested()
  @Type(() => PaymentDto)
  payment: PaymentDto
}

export class CloseOrderRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[]

  @IsUUID('4')
  @IsNotEmpty()
  closedBy: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  tip?: number | null

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  @IsOptional()
  splits?: SplitDto[] | null
}
