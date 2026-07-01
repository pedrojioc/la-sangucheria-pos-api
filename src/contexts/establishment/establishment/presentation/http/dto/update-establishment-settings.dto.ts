import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min
} from 'class-validator'

import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '../../../domain/kitchen-mode'

export class UpdateEstablishmentSettingsDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  legalName?: string

  @IsOptional()
  @IsString()
  taxId?: string

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

  @IsOptional()
  @IsString()
  @Length(3, 3)
  defaultCurrency?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  defaultTaxRate?: number

  @IsOptional()
  @IsEnum(TaxType)
  defaultTaxType?: TaxType

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean

  @IsOptional()
  @IsEnum(KitchenMode)
  kitchenMode?: KitchenMode

  @IsOptional()
  @IsString()
  receiptHeader?: string

  @IsOptional()
  @IsString()
  receiptFooter?: string

  @IsOptional()
  @IsString()
  timezone?: string

  @IsOptional()
  @IsString()
  locale?: string

  @IsOptional()
  @IsBoolean()
  loyaltyEnabled?: boolean
}
