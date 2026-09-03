import { InventoryIngredientDeductionAdapter } from '@contexts/orders/order/infrastructure/adapters/inventory-ingredient-deduction.adapter'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { NoStockAvailableException } from '@contexts/inventory/stock-level/domain/exceptions/no-stock-available.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('InventoryIngredientDeductionAdapter', () => {
  let deductIngredient: jest.Mocked<DeductIngredient>
  let adapter: InventoryIngredientDeductionAdapter

  beforeEach(() => {
    deductIngredient = { run: jest.fn() } as unknown as jest.Mocked<DeductIngredient>
    adapter = new InventoryIngredientDeductionAdapter(deductIngredient)
  })

  it('forwards all args to DeductIngredient.run and appends null as performedBy', async () => {
    const ingredientId = UuidMother.random()
    const referenceId = UuidMother.random()
    deductIngredient.run.mockResolvedValue(undefined)

    await adapter.deduct(ingredientId, 3, 'unit', 'Venta de orden', referenceId)

    expect(deductIngredient.run).toHaveBeenCalledWith(
      ingredientId,
      3,
      'unit',
      'Venta de orden',
      referenceId,
      null
    )
  })

  it('passes through a rejection unwrapped', async () => {
    const ingredientId = UuidMother.random()
    const referenceId = UuidMother.random()
    const error = new NoStockAvailableException(ingredientId)
    deductIngredient.run.mockRejectedValue(error)

    await expect(
      adapter.deduct(ingredientId, 3, 'unit', 'Venta de orden', referenceId)
    ).rejects.toBe(error)
  })
})
