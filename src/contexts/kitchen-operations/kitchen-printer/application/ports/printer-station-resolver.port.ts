export interface ResolvedPrinterStation {
  stationId: string
  stationName: string
  connectionType: 'network' | 'usb'
  printerAddress: string | null
  usbIdentifier: string | null
  lastSeenAt: Date
}

export abstract class PrinterStationResolverPort {
  abstract resolvePrinterStations(
    stationIds: Array<string | null>
  ): Promise<Array<ResolvedPrinterStation>>
}
