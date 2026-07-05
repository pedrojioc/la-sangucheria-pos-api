import { deriveKitchenMode, KitchenMode } from '@contexts/establishment/establishment/domain/kitchen-mode'

describe('deriveKitchenMode', () => {
  it('returns STATIONS when at least one device is kds', () => {
    expect(deriveKitchenMode(['kds'])).toBe(KitchenMode.STATIONS)
    expect(deriveKitchenMode(['kds', 'printer'])).toBe(KitchenMode.STATIONS)
  })

  it('returns SINGLE_PRINTER when all devices are printer and none are kds', () => {
    expect(deriveKitchenMode(['printer'])).toBe(KitchenMode.SINGLE_PRINTER)
    expect(deriveKitchenMode(['printer', 'printer'])).toBe(KitchenMode.SINGLE_PRINTER)
  })

  it('returns NONE when there are no stations or all devices are none', () => {
    expect(deriveKitchenMode([])).toBe(KitchenMode.NONE)
    expect(deriveKitchenMode(['none'])).toBe(KitchenMode.NONE)
    expect(deriveKitchenMode(['none', 'none'])).toBe(KitchenMode.NONE)
  })
})
