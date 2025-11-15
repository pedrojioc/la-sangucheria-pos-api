import { Money } from '@/shared/domain/value-objects/money'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { InventoryBatch } from '../inventory-batch'

export interface FifoDeductionResult {
  batches: Array<{
    batchId: string
    quantityDeducted: number
    unitCost: number
    totalCost: number
  }>
  totalQuantityDeducted: number
  totalCost: number
  currency: string
}

/**
 * FifoInventoryService - Domain Service
 *
 * Servicio de dominio que encapsula la lógica de costeo FIFO.
 * No es un agregado porque coordina múltiples agregados (batches).
 *
 * Responsabilidades:
 * - Calcular costo FIFO de una cantidad solicitada
 * - Deducir cantidad de múltiples batches siguiendo FIFO
 * - Determinar qué batches usar y en qué orden
 *
 * FIFO = First In, First Out
 * Los batches más antiguos (por purchaseDate) se consumen primero
 */
export class FifoInventoryService {
  /**
   * Deduce una cantidad de ingrediente usando FIFO
   * Retorna información detallada de qué batches se usaron y el costo total
   */
  deduct(availableBatches: InventoryBatch[], requestedQuantity: Quantity): FifoDeductionResult {
    // Ordenar batches por fecha de compra (FIFO)
    const sortedBatches = this.sortBatchesByFifo(availableBatches)

    let remainingToDeduct = requestedQuantity
    const deductions: FifoDeductionResult['batches'] = []
    let totalCost = new Money(0, sortedBatches[0]?.getUnitCost().currency ?? 'COP')

    for (const batch of sortedBatches) {
      if (remainingToDeduct.value === 0) break

      // Deducir de este batch
      const deducted = batch.deduct(remainingToDeduct)
      const cost = batch.calculateCost(deducted)

      deductions.push({
        batchId: batch.id.value,
        quantityDeducted: deducted.value,
        unitCost: batch.getUnitCost().amount,
        totalCost: cost.amount
      })

      totalCost = totalCost.add(cost)
      remainingToDeduct = remainingToDeduct.subtract(deducted)
    }

    // Si no pudimos deducir todo, lanzar error
    if (remainingToDeduct.value > 0) {
      throw new Error(
        `Insufficient stock. Missing ${remainingToDeduct.value} ${remainingToDeduct.unitId}`
      )
    }

    return {
      batches: deductions,
      totalQuantityDeducted: requestedQuantity.value,
      totalCost: totalCost.amount,
      currency: totalCost.currency
    }
  }

  /**
   * Calcula el costo FIFO de una cantidad SIN deducir
   * Útil para estimaciones y previews
   */
  calculateCost(availableBatches: InventoryBatch[], requestedQuantity: Quantity): Money {
    const sortedBatches = this.sortBatchesByFifo(availableBatches)

    let remainingToCalculate = requestedQuantity
    let totalCost = new Money(0, sortedBatches[0]?.getUnitCost().currency ?? 'COP')

    for (const batch of sortedBatches) {
      if (remainingToCalculate.value === 0) break

      const availableInBatch = batch.getAvailableQuantity()
      const toUse = remainingToCalculate.isGreaterThan(availableInBatch)
        ? availableInBatch
        : remainingToCalculate

      const cost = batch.calculateCost(toUse)
      totalCost = totalCost.add(cost)

      remainingToCalculate = remainingToCalculate.subtract(toUse)
    }

    if (remainingToCalculate.value > 0) {
      throw new Error(
        `Insufficient stock for cost calculation. Missing ${remainingToCalculate.value} ${remainingToCalculate.unitId}`
      )
    }

    return totalCost
  }

  /**
   * Verifica si hay stock suficiente en los batches disponibles
   */
  hasStock(availableBatches: InventoryBatch[], requestedQuantity: Quantity): boolean {
    const totalAvailable = availableBatches.reduce(
      (acc, batch) => {
        return acc.add(batch.getAvailableQuantity())
      },
      new Quantity(0, requestedQuantity.unitId)
    )

    return totalAvailable.isGreaterOrEqual(requestedQuantity)
  }

  /**
   * Ordena batches por FIFO (más antiguo primero)
   * Filtra batches agotados
   */
  private sortBatchesByFifo(batches: InventoryBatch[]): InventoryBatch[] {
    return batches
      .filter(batch => !batch.isExhausted())
      .sort((a, b) => a.getPurchaseDate().getTime() - b.getPurchaseDate().getTime())
  }
}
