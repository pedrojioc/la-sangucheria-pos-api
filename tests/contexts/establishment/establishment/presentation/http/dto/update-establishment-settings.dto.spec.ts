import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { UpdateEstablishmentSettingsDto } from '@contexts/establishment/establishment/presentation/http/dto/update-establishment-settings.dto'
import { TaxType } from '@shared/domain/value-objects/tax-type'

describe('UpdateEstablishmentSettingsDto — taxRateMatchesTaxType constraint', () => {
  it('should reject when both fields are present and invalid together (EXEMPT + nonzero rate)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      defaultTaxType: TaxType.EXEMPT,
      defaultTaxRate: 0.05
    })

    const errors = await validate(dto)

    const taxRateError = errors.find(error => error.property === 'defaultTaxRate')
    expect(taxRateError).toBeDefined()
    expect(taxRateError?.constraints).toHaveProperty('taxRateMatchesTaxType')
  })

  it('should pass when both fields are present and valid together (IVA + positive rate)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      defaultTaxType: TaxType.IVA,
      defaultTaxRate: 0.19
    })

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })

  it('should not fire the constraint when only defaultTaxRate is present', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      defaultTaxRate: 0.05
    })

    const errors = await validate(dto)

    const taxRateError = errors.find(error => error.property === 'defaultTaxRate')
    expect(taxRateError?.constraints?.taxRateMatchesTaxType).toBeUndefined()
  })

  it('should not fire the constraint when only defaultTaxType is present', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      defaultTaxType: TaxType.EXEMPT
    })

    const errors = await validate(dto)

    const taxRateError = errors.find(error => error.property === 'defaultTaxRate')
    expect(taxRateError).toBeUndefined()
  })
})

describe('UpdateEstablishmentSettingsDto — isIanaTimezone constraint', () => {
  it('should reject an invalid timezone (Foo/Bar)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      timezone: 'Foo/Bar'
    })

    const errors = await validate(dto)

    const timezoneError = errors.find(error => error.property === 'timezone')
    expect(timezoneError).toBeDefined()
    expect(timezoneError?.constraints).toHaveProperty('isIanaTimezone')
  })

  it('should accept a valid canonical timezone (America/Bogota)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      timezone: 'America/Bogota'
    })

    const errors = await validate(dto)

    const timezoneError = errors.find(error => error.property === 'timezone')
    expect(timezoneError).toBeUndefined()
  })

  it('should not fire when timezone is omitted', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      name: 'Some Name'
    })

    const errors = await validate(dto)

    const timezoneError = errors.find(error => error.property === 'timezone')
    expect(timezoneError).toBeUndefined()
  })

  it('should reject an empty string (DTO/domain parity)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      timezone: ''
    })

    const errors = await validate(dto)

    const timezoneError = errors.find(error => error.property === 'timezone')
    expect(timezoneError).toBeDefined()
    expect(timezoneError?.constraints).toHaveProperty('isIanaTimezone')
  })
})

describe('UpdateEstablishmentSettingsDto — isBcp47Locale constraint', () => {
  it('should reject an invalid locale (es_CO)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      locale: 'es_CO'
    })

    const errors = await validate(dto)

    const localeError = errors.find(error => error.property === 'locale')
    expect(localeError).toBeDefined()
    expect(localeError?.constraints).toHaveProperty('isBcp47Locale')
  })

  it('should accept a valid canonical locale (es-CO)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      locale: 'es-CO'
    })

    const errors = await validate(dto)

    const localeError = errors.find(error => error.property === 'locale')
    expect(localeError).toBeUndefined()
  })

  it('should not fire when locale is omitted', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      name: 'Some Name'
    })

    const errors = await validate(dto)

    const localeError = errors.find(error => error.property === 'locale')
    expect(localeError).toBeUndefined()
  })

  it('should reject an empty string (DTO/domain parity)', async () => {
    const dto = plainToInstance(UpdateEstablishmentSettingsDto, {
      locale: ''
    })

    const errors = await validate(dto)

    const localeError = errors.find(error => error.property === 'locale')
    expect(localeError).toBeDefined()
    expect(localeError?.constraints).toHaveProperty('isBcp47Locale')
  })
})
