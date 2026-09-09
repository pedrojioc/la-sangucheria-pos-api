import { GetConversionFactor } from '@contexts/shared-kernel/unit-conversion/application/get-conversion-factor/get-conversion-factor'
import { UnitConversionRepository } from '@contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversion } from '@contexts/shared-kernel/unit-conversion/domain/unit-conversion'
import { UnitConversionNotFound } from '@contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('GetConversionFactor', () => {
  const buildDeps = () => {
    const conversionRepository = {
      findByUnits: jest.fn(),
      searchAll: jest.fn()
    } as unknown as jest.Mocked<UnitConversionRepository>

    const useCase = new GetConversionFactor(conversionRepository)

    return { useCase, conversionRepository }
  }

  it('returns the rule factor when a conversion rule exists between the units', async () => {
    const deps = buildDeps()
    const fromUnitId = UuidMother.random()
    const toUnitId = UuidMother.random()
    const factor = 1000
    const rule = UnitConversion.create(UuidMother.random(), fromUnitId, toUnitId, factor)
    deps.conversionRepository.findByUnits.mockResolvedValue(rule)

    const result = await deps.useCase.run(fromUnitId, toUnitId)

    expect(result).toBe(factor)
  })

  it('throws UnitConversionNotFound when no conversion rule exists', async () => {
    const deps = buildDeps()
    const fromUnitId = UuidMother.random()
    const toUnitId = UuidMother.random()
    deps.conversionRepository.findByUnits.mockResolvedValue(null)

    await expect(deps.useCase.run(fromUnitId, toUnitId)).rejects.toBeInstanceOf(
      UnitConversionNotFound
    )
  })

  it('calls findByUnits, not searchAll, to preserve inverse-rule synthesis in the repository', async () => {
    const deps = buildDeps()
    const fromUnitId = UuidMother.random()
    const toUnitId = UuidMother.random()
    const rule = UnitConversion.create(UuidMother.random(), fromUnitId, toUnitId, 1000)
    deps.conversionRepository.findByUnits.mockResolvedValue(rule)

    await deps.useCase.run(fromUnitId, toUnitId)

    expect(deps.conversionRepository.findByUnits).toHaveBeenCalledWith(fromUnitId, toUnitId)
    expect(deps.conversionRepository.searchAll).not.toHaveBeenCalled()
  })
})
