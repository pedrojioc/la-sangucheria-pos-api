import { FindUnit } from '@contexts/shared-kernel/unit/application/find/find-unit'
import { UnitRepository } from '@contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { UnitNotExist } from '@contexts/shared-kernel/unit/domain/exceptions/unit-not-exist'
import { UnitMother } from '../__mothers__/UnitMother'
import { UnitResponse } from '@contexts/shared-kernel/unit/application/dto/unit.response'

describe('FindUnit', () => {
  let useCase: FindUnit
  let repository: jest.Mocked<UnitRepository>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    }

    useCase = new FindUnit(repository)
  })

  it('should find a unit by id', async () => {
    const unit = UnitMother.kilogram()
    repository.findById.mockResolvedValue(unit)

    const result = await useCase.execute(unit.id.value)

    expect(repository.findById).toHaveBeenCalledWith(unit.id)
    expect(result).toBeInstanceOf(UnitResponse)
    expect(result.id).toBe(unit.id.value)
    expect(result.name).toBe(unit.toPrimitives().name)
  })

  it('should throw error when unit does not exist', async () => {
    repository.findById.mockResolvedValue(null)

    const id = 'non-existent-id'

    await expect(useCase.execute(id)).rejects.toThrow(UnitNotExist)
  })
})
