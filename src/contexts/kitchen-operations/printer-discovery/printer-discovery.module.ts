import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DiscoveredPrinterDeviceEntity } from './infrastructure/persistence/typeorm/discovered-printer-device.entity'
import { DiscoveredPrinterDeviceRepository } from './domain/repositories/discovered-printer-device.repository'
import { TypeOrmDiscoveredPrinterDeviceRepository } from './infrastructure/persistence/typeorm/typeorm-discovered-printer-device.repository'

import { RecordDiscoveredDevice } from './application/record/record-discovered-device'
import { RecordDeviceStatus } from './application/record-status/record-device-status'
import { FindDiscoveredDevices } from './application/find-all/find-discovered-devices'
import { DiscoveredPrinterDeviceController } from './presentation/http/discovered-printer-device.controller'

import { createProvider } from '@core/utils/create-provider'
import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'

@Module({
  imports: [TypeOrmModule.forFeature([DiscoveredPrinterDeviceEntity]), EstablishmentModule],
  controllers: [DiscoveredPrinterDeviceController],
  providers: [
    {
      provide: DiscoveredPrinterDeviceRepository,
      useClass: TypeOrmDiscoveredPrinterDeviceRepository
    },
    createProvider(RecordDiscoveredDevice, [DiscoveredPrinterDeviceRepository]),
    createProvider(RecordDeviceStatus, [DiscoveredPrinterDeviceRepository]),
    createProvider(FindDiscoveredDevices, [DiscoveredPrinterDeviceRepository])
  ],
  exports: [RecordDiscoveredDevice, RecordDeviceStatus, FindDiscoveredDevices]
})
export class PrinterDiscoveryModule {}
