import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Establishment } from '../../../domain/establishment'
import { EstablishmentRepository } from '../../../domain/repositories/establishment.repository'
import { EstablishmentNotConfigured } from '../../../domain/exceptions/establishment-not-configured.exception'
import { KitchenMode } from '../../../domain/kitchen-mode'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { EstablishmentEntity } from './establishment.entity'

@Injectable()
export class TypeOrmEstablishmentRepository
  extends TransactionalRepository<EstablishmentEntity>
  implements EstablishmentRepository
{
  constructor(
    @InjectRepository(EstablishmentEntity)
    repository: Repository<EstablishmentEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async exists(): Promise<boolean> {
    const count = await this.repo.count()
    return count > 0
  }

  async findSingleton(): Promise<Establishment> {
    const entity = await this.repo.findOne({
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
      kitchenMode: (entity.kitchenMode as KitchenMode) ?? KitchenMode.NONE,
      receiptHeader: entity.receiptHeader,
      receiptFooter: entity.receiptFooter,
      timezone: entity.timezone,
      locale: entity.locale,
      loyaltyEnabled: entity.loyaltyEnabled,
      operatingHours: (entity.operatingHours as any) ?? null,
      enabledOrderTypes: entity.enabledOrderTypes ?? ['DINE_IN', 'DELIVERY', 'TAKEOUT'],
      serviceCharge: (entity.serviceCharge as any) ?? null,
      tipSuggestions: (entity.tipSuggestions as any) ?? null,
      splitCheck: entity.splitCheck ?? false,
      paymentMethods: entity.paymentMethods ?? ['CASH', 'CARD'],
      autoSendToKitchen: entity.autoSendToKitchen ?? false
    })
  }

  async save(establishment: Establishment): Promise<void> {
    const primitives = establishment.toPrimitives()
    const entity = this.repo.create({
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
      loyaltyEnabled: primitives.loyaltyEnabled,
      operatingHours: primitives.operatingHours,
      enabledOrderTypes: primitives.enabledOrderTypes,
      serviceCharge: primitives.serviceCharge,
      tipSuggestions: primitives.tipSuggestions,
      splitCheck: primitives.splitCheck,
      paymentMethods: primitives.paymentMethods,
      autoSendToKitchen: primitives.autoSendToKitchen
    })
    await this.repo.save(entity)
  }
}
