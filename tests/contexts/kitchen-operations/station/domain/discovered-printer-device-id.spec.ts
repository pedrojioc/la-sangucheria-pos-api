import { DiscoveredPrinterDeviceId } from '@contexts/kitchen-operations/station/domain/discovered-printer-device-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('DiscoveredPrinterDeviceId (VO)', () => {
  it('should accept a valid UUID', () => {
    const id = UuidMother.random()

    const vo = new DiscoveredPrinterDeviceId(id)

    expect(vo.value).toBe(id)
  })

  it('should throw when the value is not a valid UUID', () => {
    expect(() => new DiscoveredPrinterDeviceId('not-a-uuid')).toThrow()
  })
})
