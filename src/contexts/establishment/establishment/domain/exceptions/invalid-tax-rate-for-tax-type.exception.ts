import { DomainException } from '@shared/domain/exceptions/domain.exception'
import { TaxType } from '@shared/domain/value-objects/tax-type'

export class InvalidTaxRateForTaxType extends DomainException {
  constructor(taxType: TaxType, taxRate: number) {
    super(
      `Invalid tax configuration: taxType <${taxType}> requires ` +
        `${taxType === TaxType.EXEMPT ? 'taxRate = 0' : 'taxRate > 0'}, ` +
        `received <${taxRate}>.`
    )
    this.name = 'InvalidTaxRateForTaxType'
  }
}
