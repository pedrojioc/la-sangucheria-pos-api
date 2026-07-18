import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import { Type } from 'class-transformer'

import { TaxType } from '@shared/domain/value-objects/tax-type'
import { WEEKDAYS } from '../../../domain/establishment-operating-hours'
import type { Weekday } from '../../../domain/establishment-operating-hours'
import type { ServiceChargeType } from '../../../domain/establishment-service-charge'
import { isValidTimezone } from '../../../domain/establishment-timezone'
import { isCanonicalBcp47Locale } from '../../../domain/establishment-locale'

@ValidatorConstraint({ name: 'serviceChargePercentageMax' })
export class ServiceChargePercentageMaxConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === null || value === undefined) return true
    const obj = value as { type?: string; value?: number }
    if (obj.type === 'PERCENTAGE' && typeof obj.value === 'number') {
      return obj.value <= 1
    }
    return true
  }

  defaultMessage(): string {
    return 'serviceCharge.value must be between 0 and 1 (inclusive) when type is PERCENTAGE'
  }
}

@ValidatorConstraint({ name: 'taxRateMatchesTaxType' })
export class TaxRateMatchesTaxTypeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { defaultTaxType?: TaxType; defaultTaxRate?: number }
    // Fire only when BOTH fields present (partial updates deferred to domain)
    if (obj.defaultTaxType === undefined || obj.defaultTaxRate === undefined) return true
    if (obj.defaultTaxType === TaxType.EXEMPT) return obj.defaultTaxRate === 0
    return obj.defaultTaxRate > 0
  }

  defaultMessage(): string {
    return 'defaultTaxRate must be 0 when defaultTaxType is EXEMPT, and greater than 0 for IVA/INC'
  }
}

@ValidatorConstraint({ name: 'tipSuggestionsUniqueAndSorted' })
export class TipSuggestionsUniqueAndSortedConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) return true
    const nums = value as number[]
    const unique = new Set(nums).size === nums.length
    const sorted = nums.every((v, i) => i === 0 || nums[i - 1] < v)
    return unique && sorted
  }

  defaultMessage(): string {
    return 'tipSuggestions must contain unique values sorted in ascending order'
  }
}

@ValidatorConstraint({ name: 'isIanaTimezone' })
export class IsIanaTimezoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true // presence handled by @IsOptional
    if (typeof value !== 'string') return true // type handled by @IsString
    return isValidTimezone(value)
  }

  defaultMessage(): string {
    return 'timezone must be a canonical IANA time zone name'
  }
}

@ValidatorConstraint({ name: 'isBcp47Locale' })
export class IsBcp47LocaleConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true
    if (typeof value !== 'string') return true
    return isCanonicalBcp47Locale(value)
  }

  defaultMessage(): string {
    return 'locale must be a canonical BCP-47 language tag (e.g. es-CO)'
  }
}

export class OperatingHoursDayDto {
  @IsIn(WEEKDAYS)
  day!: Weekday

  @ValidateIf((o: OperatingHoursDayDto) => o.closed !== true)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  open!: string

  @ValidateIf((o: OperatingHoursDayDto) => o.closed !== true)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  close!: string

  @IsBoolean()
  closed!: boolean
}

export class OperatingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDayDto)
  schedule!: OperatingHoursDayDto[]

  @IsArray()
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  holidays!: string[]
}

export class ServiceChargeDto {
  @IsIn(['FIXED', 'PERCENTAGE'])
  type!: ServiceChargeType

  @IsNumber()
  @Min(0)
  @ValidateIf((o: ServiceChargeDto) => o.type === 'PERCENTAGE')
  @Max(1)
  value!: number
}

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
  @IsIn(['COP', 'USD', 'MXN'])
  defaultCurrency?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Validate(TaxRateMatchesTaxTypeConstraint)
  defaultTaxRate?: number

  @IsOptional()
  @IsEnum(TaxType)
  defaultTaxType?: TaxType

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean

  @IsOptional()
  @IsString()
  receiptHeader?: string

  @IsOptional()
  @IsString()
  receiptFooter?: string

  @IsOptional()
  @IsString()
  @Validate(IsIanaTimezoneConstraint)
  timezone?: string

  @IsOptional()
  @IsString()
  @Validate(IsBcp47LocaleConstraint)
  locale?: string

  @IsOptional()
  @IsBoolean()
  loyaltyEnabled?: boolean

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto | null

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['DINE_IN', 'DELIVERY', 'TAKEOUT'], { each: true })
  enabledOrderTypes?: string[]

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsObject()
  @Validate(ServiceChargePercentageMaxConstraint)
  @ValidateNested()
  @Type(() => ServiceChargeDto)
  serviceCharge?: ServiceChargeDto | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(1, { each: true })
  @Validate(TipSuggestionsUniqueAndSortedConstraint)
  tipSuggestions?: number[] | null

  @IsOptional()
  @IsBoolean()
  splitCheck?: boolean

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['CASH', 'CARD', 'TRANSFER', 'VOUCHER', 'OTHER'], { each: true })
  paymentMethods?: string[]

  @IsOptional()
  @IsBoolean()
  autoSendToKitchen?: boolean
}
