import { faker } from '@faker-js/faker'
import { Station, StationPrimitives } from '@contexts/kitchen-operations/station/domain/station'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { StationConnectionTypeEnum } from '@contexts/kitchen-operations/station/domain/station-connection-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class StationMother {
  static create(params: Partial<StationPrimitives> = {}): Station {
    const primitives: StationPrimitives = {
      id: params.id ?? UuidMother.random(),
      name: params.name ?? faker.commerce.department(),
      displayOrder: params.displayOrder ?? faker.number.int({ min: 0, max: 10 }),
      isActive: params.isActive ?? true,
      color:
        params.color !== undefined
          ? params.color
          : `#${faker.string.hexadecimal({ length: 6, casing: 'upper', prefix: '' })}`,
      outputDevice: params.outputDevice ?? StationOutputDeviceEnum.KDS,
      printerAddress: params.printerAddress !== undefined ? params.printerAddress : null,
      connectionType: params.connectionType ?? StationConnectionTypeEnum.NETWORK,
      usbIdentifier: params.usbIdentifier !== undefined ? params.usbIdentifier : null
    }
    return Station.fromPrimitives(primitives)
  }

  static random(): Station {
    return this.create()
  }

  static grill(): Station {
    return this.create({ name: 'Grill', displayOrder: 1, color: '#FF5733' })
  }

  static coldStation(): Station {
    return this.create({ name: 'Cold Station', displayOrder: 2, color: '#3366FF' })
  }

  static inactive(): Station {
    return this.create({ isActive: false })
  }

  static withoutColor(): Station {
    return this.create({ color: null })
  }

  static withPrinter(address: string = '192.168.1.50:9100'): Station {
    return this.create({
      outputDevice: StationOutputDeviceEnum.PRINTER,
      connectionType: StationConnectionTypeEnum.NETWORK,
      printerAddress: address
    })
  }

  static withUsbPrinter(identifier: string = 'USB001'): Station {
    return this.create({
      outputDevice: StationOutputDeviceEnum.PRINTER,
      connectionType: StationConnectionTypeEnum.USB,
      usbIdentifier: identifier
    })
  }

  static withNoOutput(): Station {
    return this.create({ outputDevice: StationOutputDeviceEnum.NONE })
  }
}
