import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { StockReservationRepository } from '../../../domain/repositories/stock-reservation.repository'
import { StockReservation, StockReservationPrimitives } from '../../../domain/stock-reservation'
import { StockReservationId } from '../../../domain/stock-reservation-id'
import { StockReservationStatus } from '../../../domain/stock-reservation-status'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { StockReservationEntity } from './stock-reservation.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmStockReservationRepository
  extends TransactionalRepository<StockReservationEntity>
  implements StockReservationRepository
{
  constructor(
    @InjectRepository(StockReservationEntity)
    repository: Repository<StockReservationEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(reservation: StockReservation): Promise<void> {
    const primitives = reservation.toPrimitives()
    const entity = this.repo.create({
      id: primitives.id,
      orderId: primitives.orderId,
      itemId: primitives.itemId,
      ingredientId: primitives.ingredientId,
      quantity: primitives.quantity,
      unitId: primitives.unitId,
      status: primitives.status
    })
    await this.repo.save(entity)
  }

  async search(id: StockReservationId): Promise<StockReservation | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return StockReservation.fromPrimitives(this.mapEntityToPrimitives(entity))
  }

  async findActiveByOrderItem(orderId: string, itemId: string): Promise<StockReservation[]> {
    const entities = await this.repo.find({
      where: { orderId, itemId, status: StockReservationStatus.ACTIVE }
    })
    return entities.map(entity =>
      StockReservation.fromPrimitives(this.mapEntityToPrimitives(entity))
    )
  }

  async findActiveByOrder(orderId: string): Promise<StockReservation[]> {
    const entities = await this.repo.find({
      where: { orderId, status: StockReservationStatus.ACTIVE }
    })
    return entities.map(entity =>
      StockReservation.fromPrimitives(this.mapEntityToPrimitives(entity))
    )
  }

  async sumActiveByIngredient(ingredientId: IngredientId): Promise<number> {
    const raw = await this.repo
      .createQueryBuilder('reservation')
      .select('SUM(reservation.quantity)', 'sum')
      .where('reservation.ingredient_id = :ingredientId', { ingredientId: ingredientId.value })
      .andWhere('reservation.status = :status', { status: StockReservationStatus.ACTIVE })
      .getRawOne<{ sum: string | null }>()

    return raw?.sum !== null && raw?.sum !== undefined ? Number(raw.sum) : 0
  }

  private mapEntityToPrimitives(entity: StockReservationEntity): StockReservationPrimitives {
    return {
      id: entity.id,
      orderId: entity.orderId,
      itemId: entity.itemId,
      ingredientId: entity.ingredientId,
      quantity: Number(entity.quantity),
      unitId: entity.unitId,
      status: entity.status as StockReservationStatus
    }
  }
}
