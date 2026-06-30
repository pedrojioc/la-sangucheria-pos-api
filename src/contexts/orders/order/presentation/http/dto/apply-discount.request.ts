import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID
} from 'class-validator'
import { DiscountType } from '../../../domain/discount-type'
import { DiscountMethod } from '../../../domain/discount-method'

export class ApplyDiscountRequest {
  @IsEnum(DiscountType)
  @IsNotEmpty()
  type: DiscountType

  @IsEnum(DiscountMethod)
  @IsNotEmpty()
  method: DiscountMethod

  @IsNumber()
  @IsPositive()
  value: number

  @IsUUID('4')
  @IsNotEmpty()
  appliedBy: string

  @IsString()
  @IsOptional()
  reason?: string | null
}
