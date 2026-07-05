export abstract class StationOutputDevicesPort {
  abstract list(): Promise<string[]>
}
