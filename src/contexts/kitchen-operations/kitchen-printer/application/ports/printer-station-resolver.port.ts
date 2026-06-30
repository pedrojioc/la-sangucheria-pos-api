export abstract class PrinterStationResolverPort {
  abstract resolvePrinterStations(
    stationIds: Array<string | null>
  ): Promise<Array<{ stationId: string; stationName: string; printerAddress: string }>>
}
