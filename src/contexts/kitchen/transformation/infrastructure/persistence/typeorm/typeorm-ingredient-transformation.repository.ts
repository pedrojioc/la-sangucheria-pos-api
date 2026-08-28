import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IngredientTransformationRepository } from '@contexts/kitchen/transformation/domain/repositories/ingredient-transformation.repository'
import { IngredientTransformation } from '@contexts/kitchen/transformation/domain/ingredient-transformation'
import { TransformationId } from '@contexts/kitchen/transformation/domain/transformation-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { IngredientTransformationEntity } from './ingredient-transformation.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmIngredientTransformationRepository
  extends TransactionalRepository<IngredientTransformationEntity>
  implements IngredientTransformationRepository
{
  constructor(
    @InjectRepository(IngredientTransformationEntity)
    repository: Repository<IngredientTransformationEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(transformation: IngredientTransformation): Promise<void> {
    const primitives = transformation.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: TransformationId): Promise<IngredientTransformation | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return IngredientTransformation.fromPrimitives(entity)
  }

  async findByOutputIngredient(ingredientId: IngredientId): Promise<IngredientTransformation[]> {
    const entities = await this.repo.find({
      where: { outputIngredientId: ingredientId.value },
      order: { performedAt: 'DESC' }
    })

    return entities.map(entity => IngredientTransformation.fromPrimitives(entity))
  }

  async findByBaseIngredient(ingredientId: IngredientId): Promise<IngredientTransformation[]> {
    const entities = await this.repo.find({
      where: { baseIngredientId: ingredientId.value },
      order: { performedAt: 'DESC' }
    })

    return entities.map(entity => IngredientTransformation.fromPrimitives(entity))
  }

  async searchAll(): Promise<IngredientTransformation[]> {
    const entities = await this.repo.find({
      order: { performedAt: 'DESC' }
    })

    return entities.map(entity => IngredientTransformation.fromPrimitives(entity))
  }
}
