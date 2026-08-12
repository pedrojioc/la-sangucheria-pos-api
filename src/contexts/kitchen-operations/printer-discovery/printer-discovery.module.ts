import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DiscoveredPrinterDeviceEntity } from './infrastructure/persistence/typeorm/discovered-printer-device.entity'
import { DiscoveredPrinterDeviceRepository } from './domain/repositories/discovered-printer-device.repository'
import { TypeOrmDiscoveredPrinterDeviceRepository } from './infrastructure/persistence/typeorm/typeorm-discovered-printer-device.repository'
import { PrinterDeviceLookupAdapter } from './infrastructure/adapters/printer-device-lookup.adapter'

import { RecordDiscoveredDevice } from './application/record/record-discovered-device'
import { RecordDeviceStatus } from './application/record-status/record-device-status'
import { FindDiscoveredDevices } from './application/find-all/find-discovered-devices'
import { DiscoveredPrinterDeviceController } from './presentation/http/discovered-printer-device.controller'

import { createProvider } from '@core/utils/create-provider'
import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'
import { PrinterDeviceLookupPort } from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'

@Module({
  imports: [
    TypeOrmModule.forFeature([DiscoveredPrinterDeviceEntity]),
    // EstablishmentModule imports StationModule, which in turn imports
    // PrinterDiscoveryModule — so this side must use forwardRef to break
    // the 3-way circular dependency (StationModule -> PrinterDiscoveryModule
    // -> EstablishmentModule -> StationModule).
    forwardRef(() => EstablishmentModule)
  ],
  controllers: [DiscoveredPrinterDeviceController],
  providers: [
    {
      provide: DiscoveredPrinterDeviceRepository,
      useClass: TypeOrmDiscoveredPrinterDeviceRepository
    },
    {
      provide: PrinterDeviceLookupPort,
      useClass: PrinterDeviceLookupAdapter
    },
    createProvider(RecordDiscoveredDevice, [DiscoveredPrinterDeviceRepository]),
    createProvider(RecordDeviceStatus, [DiscoveredPrinterDeviceRepository]),
    createProvider(FindDiscoveredDevices, [DiscoveredPrinterDeviceRepository])
  ],
  exports: [
    RecordDiscoveredDevice,
    RecordDeviceStatus,
    FindDiscoveredDevices,
    PrinterDeviceLookupPort
  ]
})
export class PrinterDiscoveryModule {}
