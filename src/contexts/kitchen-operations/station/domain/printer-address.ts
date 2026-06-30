import { InvalidPrinterAddress } from './exceptions/invalid-printer-address.exception'

export class PrinterAddress {
  private static readonly DEFAULT_PORT = 9100
  private static readonly HOST_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/
  private static readonly IPV4_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

  readonly value: string

  constructor(value: string) {
    const { host, port } = this.parse(value)
    this.ensureValidHost(host, value)
    this.ensureValidPort(port, value)
    this.value = `${host}:${port}`
  }

  private parse(value: string): { host: string; port: number } {
    const lastColon = value.lastIndexOf(':')

    if (lastColon === -1) {
      return { host: value, port: PrinterAddress.DEFAULT_PORT }
    }

    const afterColon = value.substring(lastColon + 1)
    const parsedPort = Number(afterColon)

    if (Number.isInteger(parsedPort) && afterColon.length > 0) {
      return { host: value.substring(0, lastColon), port: parsedPort }
    }

    return { host: value, port: PrinterAddress.DEFAULT_PORT }
  }

  private ensureValidHost(host: string, original: string): void {
    if (!host || !PrinterAddress.HOST_PATTERN.test(host)) {
      throw new InvalidPrinterAddress(original)
    }
  }

  private ensureValidPort(port: number, original: string): void {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new InvalidPrinterAddress(original)
    }
  }
}
