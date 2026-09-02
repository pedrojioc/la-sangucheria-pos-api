import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  Validate
} from 'class-validator'

import { TaxType } from '@shared/domain/value-objects/tax-type'
import {
  IsBcp47LocaleConstraint,
  IsIanaTimezoneConstraint,
  TaxRateMatchesTaxTypeConstraint
} from './update-establishment-settings.dto'

export class CreateEstablishmentSettingsDto {
  @IsUUID()
  id!: string

  @IsString()
  name!: string

  @IsString()
  displayName!: string

  @IsString()
  legalName!: string

  @IsString()
  taxId!: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsString()
  websiteUrl?: string

  @IsIn(['COP', 'USD', 'MXN'])
  defaultCurrency!: string

  @IsNumber()
  @Min(0)
  @Max(1)
  @Validate(TaxRateMatchesTaxTypeConstraint)
  defaultTaxRate!: number

  @IsEnum(TaxType)
  defaultTaxType!: TaxType

  @IsBoolean()
  taxInclusive!: boolean

  @IsOptional()
  @IsString()
  receiptHeader?: string

  @IsOptional()
  @IsString()
  receiptFooter?: string

  @IsString()
  @Validate(IsIanaTimezoneConstraint)
  timezone!: string

  @IsString()
  @Validate(IsBcp47LocaleConstraint)
  locale!: string

  @IsBoolean()
  loyaltyEnabled!: boolean
}
