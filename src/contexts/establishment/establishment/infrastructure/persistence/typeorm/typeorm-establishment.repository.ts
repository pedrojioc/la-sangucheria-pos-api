import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Establishment } from '../../../domain/establishment'
import { EstablishmentRepository } from '../../../domain/repositories/establishment.repository'
import { EstablishmentNotConfigured } from '../../../domain/exceptions/establishment-not-configured.exception'
import { KitchenMode } from '../../../domain/kitchen-mode'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { EstablishmentEntity } from './establishment.entity'

// NOTE: After this PR merges, run the migration:
//   name=CreateEstablishmentsTable pnpm migration:generate
// Review and edit the generated migration to add the idempotent seed:
//   INSERT INTO establishments (id, name, display_name, legal_name, tax_id,
//     default_currency, default_tax_rate, default_tax_type, tax_inclusive,
//     kitchen_mode, timezone, locale, loyalty_enabled)
//   VALUES (
//     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
//     'La Sanguchería', 'La Sanguchería', 'La Sanguchería S.A.S.', '900000000-0',
//     'COP', 0.08, 'INC', true, 'NONE', 'America/Bogota', 'es-CO', false
//   )
//   ON CONFLICT (id) DO NOTHING;

@Injectable()
export class TypeOrmEstablishmentRepository implements EstablishmentRepository {
  constructor(
    @InjectRepository(EstablishmentEntity)
    private readonly repository: Repository<EstablishmentEntity>
  ) {}

  async findSingleton(): Promise<Establishment> {
    const entity = await this.repository.findOne({
      where: {},
      order: { createdAt: 'ASC' }
    })

    if (!entity) {
      throw new EstablishmentNotConfigured()
    }

    return Establishment.fromPrimitives({
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      legalName: entity.legalName,
      taxId: entity.taxId,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      logoUrl: entity.logoUrl,
      websiteUrl: entity.websiteUrl,
      defaultCurrency: entity.defaultCurrency,
      defaultTaxRate: entity.defaultTaxRate,
      defaultTaxType: entity.defaultTaxType as TaxType,
      taxInclusive: entity.taxInclusive,
      kitchenMode: entity.kitchenMode as KitchenMode,
      receiptHeader: entity.receiptHeader,
      receiptFooter: entity.receiptFooter,
      timezone: entity.timezone,
      locale: entity.locale,
      loyaltyEnabled: entity.loyaltyEnabled
    })
  }

  async save(establishment: Establishment): Promise<void> {
    const primitives = establishment.toPrimitives()
    const entity = this.repository.create({
      id: primitives.id,
      name: primitives.name,
      displayName: primitives.displayName,
      legalName: primitives.legalName,
      taxId: primitives.taxId,
      phone: primitives.phone,
      email: primitives.email,
      address: primitives.address,
      logoUrl: primitives.logoUrl,
      websiteUrl: primitives.websiteUrl,
      defaultCurrency: primitives.defaultCurrency,
      defaultTaxRate: primitives.defaultTaxRate,
      defaultTaxType: primitives.defaultTaxType,
      taxInclusive: primitives.taxInclusive,
      kitchenMode: primitives.kitchenMode,
      receiptHeader: primitives.receiptHeader,
      receiptFooter: primitives.receiptFooter,
      timezone: primitives.timezone,
      locale: primitives.locale,
      loyaltyEnabled: primitives.loyaltyEnabled
    })
    await this.repository.save(entity)
  }
}
