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
