import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
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

export type TipSelectionKind = 'NONE' | 'INDEX'

export class TipSelectionDto {
  @IsEnum(['NONE', 'INDEX'])
  @IsNotEmpty()
  kind: TipSelectionKind

  @ValidateIf(o => o.kind === 'INDEX')
  @IsInt()
  @Min(0)
  @Max(2)
  index?: number
}

export class CloseOrderRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[]

  @IsUUID('4')
  @IsNotEmpty()
  closedBy: string

  @ValidateNested()
  @Type(() => TipSelectionDto)
  @IsNotEmpty()
  tipSelection: TipSelectionDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  @IsOptional()
  splits?: SplitDto[] | null
}
