import { DomainException } from '@shared/domain/exceptions/domain.exception'
import { DiscoveredPrinterDeviceNotExist } from '@contexts/kitchen-operations/station/domain/exceptions/discovered-printer-device-not-exist.exception'

describe('DiscoveredPrinterDeviceNotExist (exception)', () => {
  it('should extend DomainException', () => {
    const exception = new DiscoveredPrinterDeviceNotExist('device-404')

    expect(exception).toBeInstanceOf(DomainException)
  })

  it('should include the device id in the message', () => {
    const exception = new DiscoveredPrinterDeviceNotExist('device-404')

    expect(exception.message).toContain('device-404')
  })
})
