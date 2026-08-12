import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { UpdateStationRequest } from '@contexts/kitchen-operations/station/presentation/http/dto/update-station.request'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UpdateStationRequest — discoveredPrinterDeviceId', () => {
  it('rejects a non-UUID device id', async () => {
    const dto = plainToInstance(UpdateStationRequest, {
      name: 'Grill',
      displayOrder: 1,
      isActive: true,
      discoveredPrinterDeviceId: 'not-a-uuid'
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeDefined()
    expect(deviceIdError?.constraints).toHaveProperty('isUuid')
  })

  it('accepts a valid UUID device id', async () => {
    const dto = plainToInstance(UpdateStationRequest, {
      name: 'Grill',
      displayOrder: 1,
      isActive: true,
      discoveredPrinterDeviceId: UuidMother.random()
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeUndefined()
  })

  it('accepts an omitted device id (optional)', async () => {
    const dto = plainToInstance(UpdateStationRequest, {
      name: 'Cold Station',
      displayOrder: 2,
      isActive: true
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeUndefined()
  })

  it('does not expose printerAddress/connectionType/usbIdentifier fields anymore', () => {
    const dto = new UpdateStationRequest()
    expect('printerAddress' in dto).toBe(false)
    expect('connectionType' in dto).toBe(false)
    expect('usbIdentifier' in dto).toBe(false)
  })
})
