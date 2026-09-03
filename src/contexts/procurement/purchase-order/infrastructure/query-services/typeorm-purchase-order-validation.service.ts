import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { PurchaseOrderValidationService } from '../../domain/services/purchase-order-validation.service'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { IngredientsNotFound } from '@/contexts/procurement/purchase-order/domain/exceptions/ingredients-not-found.exception'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
// import { SupplierEntity } from '@/contexts/inventory/supplier/infrastructure/persistence/typeorm/supplier.entity'
// import { SupplierNotFound } from '@/contexts/procurement/purchase-order/domain/exceptions/supplier-not-found'

@Injectable()
export class TypeormPurchaseOrderValidationService implements PurchaseOrderValidationService {
  constructor(
    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>

    // @InjectRepository(SupplierEntity)
    // private readonly supplierRepository: Repository<SupplierEntity>
  ) {}

  async validateIngredientsExists(ingredientIds: IngredientId[]): Promise<void> {
    const uniqueIds = [...new Set(ingredientIds.map(id => id.value))]

    const existingIngredients = await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .select('ingredient.id')
      .where('ingredient.id IN (:...ids)', { ids: uniqueIds })
      .getMany()

    const existingIds = new Set(existingIngredients.map(i => i.id))
    const missingIds = uniqueIds.filter(id => !existingIds.has(id))

    if (missingIds.length > 0) {
      throw new IngredientsNotFound(missingIds)
    }
  }

  async validateSupplierExists(supplierId: string): Promise<void> {
    // TODO: Implement supplier validation
    // const supplier = await this.supplierRepository.findOneBy({ id: supplierId })
    // if (!supplier) {
    //   throw new SupplierNotFound(supplierId)
    // }
  }

  async validateUnitsExist(unitIds: string[]): Promise<void> {
    // TODO: Implement unit validation
    /*
    const uniqueIds = [...new Set(unitIds)]

    const existingUnits = await this.unitRepository
      .createQueryBuilder('unit')
      .select('unit.id')
      .where('unit.id IN (:...ids)', { ids: uniqueIds })
      .getMany()

    const existingIds = new Set(existingUnits.map(u => u.id))
    const missingIds = uniqueIds.filter(id => !existingIds.has(id))

    if (missingIds.length > 0) {
      throw new UnitsNotFound(missingIds)
    }
    */
  }
}
