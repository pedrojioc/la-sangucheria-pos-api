/** A station with outputDevice=printer at any physical location (including FOH/cashier) routes kitchen tickets; no establishment-level "main printer" concept exists. */
export abstract class StationOutputDevicesPort {
  abstract list(): Promise<string[]>
}
