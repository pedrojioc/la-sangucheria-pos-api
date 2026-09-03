import { MenuProductDeductionPlanAdapter } from '@contexts/orders/order/infrastructure/adapters/menu-product-deduction-plan.adapter'
import { FindProduct } from '@contexts/menu/product/application/find/find-product'
import { FindProductRecipe } from '@contexts/menu/product-recipe/application/find/find-product-recipe'
import { Product } from '@contexts/menu/product/domain/product'
import { ProductNotExist } from '@contexts/menu/product/domain/exceptions/product-not-exist.exception'
import { ProductId } from '@contexts/menu/product/domain/product-id'
import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeItem } from '@contexts/menu/product-recipe/domain/product-recipe-item'
import { ProductRecipeNotFound } from '@contexts/menu/product-recipe/domain/exceptions/product-recipe-not-found.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('MenuProductDeductionPlanAdapter', () => {
  let findProduct: jest.Mocked<FindProduct>
  let findProductRecipe: jest.Mocked<FindProductRecipe>
  let adapter: MenuProductDeductionPlanAdapter

  beforeEach(() => {
    findProduct = { run: jest.fn() } as unknown as jest.Mocked<FindProduct>
    findProductRecipe = { run: jest.fn() } as unknown as jest.Mocked<FindProductRecipe>
    adapter = new MenuProductDeductionPlanAdapter(findProduct, findProductRecipe)
  })

  describe('findPlan', () => {
    it('maps a DIRECT product to a DIRECT plan with its ingredientId', async () => {
      const productId = UuidMother.random()
      const ingredientId = UuidMother.random()
      const product = Product.create(
        productId,
        'Bottled Water',
        UuidMother.random(),
        2,
        'SKU-1',
        'DIRECT',
        null,
        ingredientId
      )
      findProduct.run.mockResolvedValue(product)

      const result = await adapter.findPlan(productId)

      expect(result).toEqual({ strategy: 'DIRECT', ingredientId })
    })

    it('maps a RECIPE product to a RECIPE plan with null ingredientId', async () => {
      const productId = UuidMother.random()
      const product = Product.create(
        productId,
        'Sanguche',
        UuidMother.random(),
        8,
        'SKU-2',
        'RECIPE'
      )
      findProduct.run.mockResolvedValue(product)

      const result = await adapter.findPlan(productId)

      expect(result).toEqual({ strategy: 'RECIPE', ingredientId: null })
    })

    it('returns null when the product does not exist', async () => {
      const productId = UuidMother.random()
      findProduct.run.mockRejectedValue(new ProductNotExist(new ProductId(productId)))

      const result = await adapter.findPlan(productId)

      expect(result).toBeNull()
    })

    it('re-throws any error other than ProductNotExist', async () => {
      const productId = UuidMother.random()
      findProduct.run.mockRejectedValue(new Error('db down'))

      await expect(adapter.findPlan(productId)).rejects.toThrow('db down')
    })
  })

  describe('findRecipeItems', () => {
    it('unwraps recipe items to flat DTOs', async () => {
      const productId = UuidMother.random()
      const bread = UuidMother.random()
      const meat = UuidMother.random()
      const recipe = ProductRecipe.create(UuidMother.random(), productId, [
        ProductRecipeItem.create(bread, 2, 'unit'),
        ProductRecipeItem.create(meat, 150, 'g')
      ])
      findProductRecipe.run.mockResolvedValue(recipe)

      const result = await adapter.findRecipeItems(productId)

      expect(result).toEqual([
        { ingredientId: bread, quantity: 2, unitId: 'unit' },
        { ingredientId: meat, quantity: 150, unitId: 'g' }
      ])
    })

    it('returns null when the recipe does not exist', async () => {
      const productId = UuidMother.random()
      findProductRecipe.run.mockRejectedValue(new ProductRecipeNotFound(productId))

      const result = await adapter.findRecipeItems(productId)

      expect(result).toBeNull()
    })

    it('re-throws any error other than ProductRecipeNotFound', async () => {
      const productId = UuidMother.random()
      findProductRecipe.run.mockRejectedValue(new Error('db down'))

      await expect(adapter.findRecipeItems(productId)).rejects.toThrow('db down')
    })
  })
})
