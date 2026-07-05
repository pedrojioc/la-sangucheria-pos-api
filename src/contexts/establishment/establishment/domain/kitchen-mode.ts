export enum KitchenMode {
  STATIONS = 'STATIONS',
  SINGLE_PRINTER = 'SINGLE_PRINTER',
  NONE = 'NONE'
}

export function deriveKitchenMode(devices: string[]): KitchenMode {
  if (devices.some(d => d === 'kds')) return KitchenMode.STATIONS
  if (devices.length > 0 && devices.every(d => d === 'printer')) return KitchenMode.SINGLE_PRINTER
  return KitchenMode.NONE
}
