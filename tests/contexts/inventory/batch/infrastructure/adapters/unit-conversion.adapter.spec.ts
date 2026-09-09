import { SharedKernelUnitConversionAdapter } from '@contexts/inventory/batch/infrastructure/adapters/unit-conversion.adapter'
import { GetConversionFactor } from '@contexts/shared-kernel/unit-conversion/application/get-conversion-factor/get-conversion-factor'
import { UnitConversionNotFound } from '@contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('SharedKernelUnitConversionAdapter', () => {
  const buildDeps = () => {
    const getConversionFactor = {
      run: jest.fn()
    } as unknown as jest.Mocked<GetConversionFactor>

    const adapter = new SharedKernelUnitConversionAdapter(getConversionFactor)

    return { adapter, getConversionFactor }
  }

  it('calls GetConversionFactor.run with both unit ids, in order', async () => {
    const deps = buildDeps()
    const fromUnitId = UuidMother.random()
    const toUnitId = UuidMother.random()
    deps.getConversionFactor.run.mockResolvedValue(1000)

    await deps.adapter.getFactor(fromUnitId, toUnitId)

    expect(deps.getConversionFactor.run).toHaveBeenCalledWith(fromUnitId, toUnitId)
  })

  it('returns the resolved factor unchanged', async () => {
    const deps = buildDeps()
    deps.getConversionFactor.run.mockResolvedValue(1000)

    const result = await deps.adapter.getFactor(UuidMother.random(), UuidMother.random())

    expect(result).toBe(1000)
  })

  it('propagates UnitConversionNotFound unwrapped, without catching it', async () => {
    const deps = buildDeps()
    const fromUnitId = UuidMother.random()
    const toUnitId = UuidMother.random()
    const error = new UnitConversionNotFound(fromUnitId, toUnitId)
    deps.getConversionFactor.run.mockRejectedValue(error)

    await expect(deps.adapter.getFactor(fromUnitId, toUnitId)).rejects.toBe(error)
  })
})
