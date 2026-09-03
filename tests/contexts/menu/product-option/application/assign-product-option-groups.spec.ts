import { AssignProductOptionGroups } from '@contexts/menu/product-option/application/assign/assign-product-option-groups'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { OptionGroupRepository } from '@contexts/menu/product-option/domain/repositories/option-group.repository'
import { ProductOptionGroupRepository } from '@contexts/menu/product-option/domain/repositories/product-option-group.repository'
import { OptionGroupNotFound } from '@contexts/menu/product-option/domain/exceptions/option-group-not-found.exception'
import { DuplicateOptionGroupInAssignment } from '@contexts/menu/product-option/domain/exceptions/duplicate-option-group-in-assignment.exception'
import { ProductNotExist } from '@contexts/menu/product/domain/exceptions/product-not-exist.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OptionGroupMother } from '../__mothers__/option-group.mother'

const mockProduct = { id: { value: '' }, toPrimitives: jest.fn() } as any

describe('AssignProductOptionGroups', () => {
  let useCase: AssignProductOptionGroups
  let productRepository: jest.Mocked<ProductRepository>
  let optionGroupRepository: jest.Mocked<OptionGroupRepository>
  let pivotRepository: jest.Mocked<ProductOptionGroupRepository>

  beforeEach(() => {
    productRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findBySku: jest.fn(),
      matching: jest.fn(),
      delete: jest.fn(),
      getLastSkuNumber: jest.fn()
    } as any

    optionGroupRepository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn(),
      findByIds: jest.fn(),
      delete: jest.fn(),
      isAssignedToAnyProduct: jest.fn()
    } as any

    pivotRepository = {
      replaceForProduct: jest.fn(),
      findByProductId: jest.fn()
    } as any

    useCase = new AssignProductOptionGroups(
      productRepository,
      optionGroupRepository,
      pivotRepository
    )
  })

  it('should replace pivot rows when product and groups exist', async () => {
    const productId = UuidMother.random()
    const group1 = OptionGroupMother.random()
    const group2 = OptionGroupMother.random()
    productRepository.search.mockResolvedValue({ ...mockProduct, id: { value: productId } })
    optionGroupRepository.findByIds.mockResolvedValue([group1, group2])

    await useCase.run(productId, [
      { id: group1.id.value, sortOrder: 0 },
      { id: group2.id.value, sortOrder: 1 }
    ])

    expect(pivotRepository.replaceForProduct).toHaveBeenCalledWith(productId, [
      { groupId: group1.id.value, sortOrder: 0 },
      { groupId: group2.id.value, sortOrder: 1 }
    ])
  })

  it('should allow assigning an empty list (remove all groups)', async () => {
    const productId = UuidMother.random()
    productRepository.search.mockResolvedValue({ ...mockProduct, id: { value: productId } })

    await useCase.run(productId, [])

    expect(pivotRepository.replaceForProduct).toHaveBeenCalledWith(productId, [])
    expect(optionGroupRepository.findByIds).not.toHaveBeenCalled()
  })

  it('should throw DuplicateOptionGroupInAssignment when same group appears twice', async () => {
    const productId = UuidMother.random()
    const groupId = UuidMother.random()
    productRepository.search.mockResolvedValue({ ...mockProduct, id: { value: productId } })

    await expect(
      useCase.run(productId, [
        { id: groupId, sortOrder: 0 },
        { id: groupId, sortOrder: 1 }
      ])
    ).rejects.toThrow(DuplicateOptionGroupInAssignment)

    expect(pivotRepository.replaceForProduct).not.toHaveBeenCalled()
  })

  it('should throw OptionGroupNotFound when a group id does not exist', async () => {
    const productId = UuidMother.random()
    const existingGroup = OptionGroupMother.random()
    const missingGroupId = UuidMother.random()
    productRepository.search.mockResolvedValue({ ...mockProduct, id: { value: productId } })
    optionGroupRepository.findByIds.mockResolvedValue([existingGroup])

    await expect(
      useCase.run(productId, [
        { id: existingGroup.id.value, sortOrder: 0 },
        { id: missingGroupId, sortOrder: 1 }
      ])
    ).rejects.toThrow(OptionGroupNotFound)

    expect(pivotRepository.replaceForProduct).not.toHaveBeenCalled()
  })

  it('should throw ProductNotExist when product does not exist', async () => {
    productRepository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random(), [])).rejects.toThrow(ProductNotExist)
  })
})
