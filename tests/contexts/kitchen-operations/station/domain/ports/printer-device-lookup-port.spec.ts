import {
  PrinterDeviceLookupPort,
  PrinterDeviceLookupResult
} from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'

class FakePrinterDeviceLookupAdapter extends PrinterDeviceLookupPort {
  findById(id: string): Promise<PrinterDeviceLookupResult | null> {
    void id
    return Promise.resolve(null)
  }
}

describe('PrinterDeviceLookupPort (abstract port)', () => {
  it('should be implementable with only a findById read method', () => {
    const adapter = new FakePrinterDeviceLookupAdapter()

    expect(adapter.findById).toBeInstanceOf(Function)
  })

  it('should not expose save/delete/update mutation methods on an implementation', () => {
    const adapter = new FakePrinterDeviceLookupAdapter() as unknown as Record<string, unknown>

    expect(adapter.save).toBeUndefined()
    expect(adapter.delete).toBeUndefined()
    expect(adapter.update).toBeUndefined()
  })

  it('should require findById to return a Promise of PrinterDeviceLookupResult | null', async () => {
    const adapter = new FakePrinterDeviceLookupAdapter()

    const result = await adapter.findById('device-1')

    expect(result).toBeNull()
  })
})
