import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { TAX_REGIMES, TaxRegimeValue } from '../../../domain/customer-tax-regime'

export class UpdateCustomerRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string

  @IsEnum(TAX_REGIMES)
  taxRegime: TaxRegimeValue

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string

  @IsString()
  @IsOptional()
  notes?: string
}
