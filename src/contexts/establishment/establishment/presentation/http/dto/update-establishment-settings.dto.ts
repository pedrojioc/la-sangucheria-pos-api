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
  Length,
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
import { KitchenMode } from '../../../domain/kitchen-mode'
import { WEEKDAYS } from '../../../domain/establishment-operating-hours'
import type { Weekday } from '../../../domain/establishment-operating-hours'
import type { ServiceChargeType } from '../../../domain/establishment-service-charge'

@ValidatorConstraint({ name: 'serviceChargePercentageMax' })
export class ServiceChargePercentageMaxConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (value === null || value === undefined) return true
    const obj = value as { type?: string; value?: number }
    if (obj.type === 'PERCENTAGE' && typeof obj.value === 'number') {
      return obj.value <= 1
    }
    return true
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'serviceCharge.value must be between 0 and 1 (inclusive) when type is PERCENTAGE'
  }
}

@ValidatorConstraint({ name: 'tipSuggestionsUniqueAndSorted' })
export class TipSuggestionsUniqueAndSortedConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (!Array.isArray(value)) return true
    const nums = value as number[]
    const unique = new Set(nums).size === nums.length
    const sorted = nums.every((v, i) => i === 0 || nums[i - 1] < v)
    return unique && sorted
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'tipSuggestions must contain unique values sorted in ascending order'
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
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(1, { each: true })
  @Validate(TipSuggestionsUniqueAndSortedConstraint)
  tipSuggestions?: [number, number, number] | null

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
