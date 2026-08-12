import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { CreateStationRequest } from '@contexts/kitchen-operations/station/presentation/http/dto/create-station.request'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateStationRequest — discoveredPrinterDeviceId', () => {
  it('rejects a non-UUID device id', async () => {
    const dto = plainToInstance(CreateStationRequest, {
      id: UuidMother.random(),
      name: 'Grill',
      displayOrder: 1,
      discoveredPrinterDeviceId: 'not-a-uuid'
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeDefined()
    expect(deviceIdError?.constraints).toHaveProperty('isUuid')
  })

  it('accepts a valid UUID device id', async () => {
    const dto = plainToInstance(CreateStationRequest, {
      id: UuidMother.random(),
      name: 'Grill',
      displayOrder: 1,
      discoveredPrinterDeviceId: UuidMother.random()
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeUndefined()
  })

  it('accepts an omitted device id (optional)', async () => {
    const dto = plainToInstance(CreateStationRequest, {
      id: UuidMother.random(),
      name: 'Cold Station',
      displayOrder: 2
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeUndefined()
  })

  it('accepts a null device id (optional, explicit clear)', async () => {
    const dto = plainToInstance(CreateStationRequest, {
      id: UuidMother.random(),
      name: 'Cold Station',
      displayOrder: 2,
      discoveredPrinterDeviceId: null
    })

    const errors = await validate(dto)

    const deviceIdError = errors.find(error => error.property === 'discoveredPrinterDeviceId')
    expect(deviceIdError).toBeUndefined()
  })

  it('does not expose printerAddress/connectionType/usbIdentifier fields anymore', () => {
    const dto = new CreateStationRequest()
    expect('printerAddress' in dto).toBe(false)
    expect('connectionType' in dto).toBe(false)
    expect('usbIdentifier' in dto).toBe(false)
  })
})
