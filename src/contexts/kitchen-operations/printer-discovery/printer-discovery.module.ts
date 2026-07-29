import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DiscoveredPrinterDeviceEntity } from './infrastructure/persistence/typeorm/discovered-printer-device.entity'
import { DiscoveredPrinterDeviceRepository } from './domain/repositories/discovered-printer-device.repository'
import { TypeOrmDiscoveredPrinterDeviceRepository } from './infrastructure/persistence/typeorm/typeorm-discovered-printer-device.repository'

import { RecordDiscoveredDevice } from './application/record/record-discovered-device'
import { FindDiscoveredDevices } from './application/find-all/find-discovered-devices'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([DiscoveredPrinterDeviceEntity])],
  providers: [
    {
      provide: DiscoveredPrinterDeviceRepository,
      useClass: TypeOrmDiscoveredPrinterDeviceRepository
    },
    createProvider(RecordDiscoveredDevice, [DiscoveredPrinterDeviceRepository]),
    createProvider(FindDiscoveredDevices, [DiscoveredPrinterDeviceRepository])
  ],
  exports: [RecordDiscoveredDevice, FindDiscoveredDevices]
})
export class PrinterDiscoveryModule {}
