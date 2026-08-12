import { DataSource } from 'typeorm'
import { TypeOrmPrinterStationResolverAdapter } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/adapters/typeorm-printer-station-resolver.adapter'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmPrinterStationResolverAdapter', () => {
  let dataSource: jest.Mocked<DataSource>
  let adapter: TypeOrmPrinterStationResolverAdapter

  beforeEach(() => {
    dataSource = {
      query: jest.fn()
    } as unknown as jest.Mocked<DataSource>

    adapter = new TypeOrmPrinterStationResolverAdapter(dataSource)
  })

  it('returns an empty array without querying the database when given no station ids', async () => {
    const result = await adapter.resolvePrinterStations([null, null])

    expect(dataSource.query).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('queries only stations configured as printer, joined to their device, and maps NETWORK rows to the port shape (regression)', async () => {
    const stationId = UuidMother.random()
    const lastSeenAt = new Date('2026-08-12T12:00:00Z')

    dataSource.query.mockResolvedValue([
      {
        id: stationId,
        name: 'Parrilla',
        address: '192.168.1.10',
        connection_type: 'network',
        usb_identifier: null,
        last_seen_at: lastSeenAt
      }
    ])

    const result = await adapter.resolvePrinterStations([stationId])

    const [sql, params] = dataSource.query.mock.calls[0]
    expect(sql).toContain("output_device = 'printer'")
    expect(sql).toContain('JOIN discovered_printer_devices')
    expect(sql).toContain('stations.discovered_printer_device_id = discovered_printer_devices.id')
    expect(params).toEqual([[stationId]])
    expect(result).toEqual([
      {
        stationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null,
        lastSeenAt
      }
    ])
  })

  it('does NOT filter on address IS NOT NULL (bug fix) and returns USB-only stations', async () => {
    const stationId = UuidMother.random()
    const lastSeenAt = new Date('2026-08-12T12:00:00Z')

    dataSource.query.mockResolvedValue([
      {
        id: stationId,
        name: 'Caja USB',
        address: null,
        connection_type: 'usb',
        usb_identifier: 'USB001',
        last_seen_at: lastSeenAt
      }
    ])

    const result = await adapter.resolvePrinterStations([stationId])

    const [sql] = dataSource.query.mock.calls[0]
    expect(sql).not.toMatch(/address IS NOT NULL/)
    expect(result).toEqual([
      {
        stationId,
        stationName: 'Caja USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'USB001',
        lastSeenAt
      }
    ])
  })

  it('excludes a printer station with no assigned device (inner join naturally excludes it) without crashing', async () => {
    dataSource.query.mockResolvedValue([])

    const result = await adapter.resolvePrinterStations([UuidMother.random()])

    expect(result).toEqual([])
  })

  it('filters out null station ids before querying', async () => {
    const stationId = UuidMother.random()
    dataSource.query.mockResolvedValue([])

    await adapter.resolvePrinterStations([null, stationId, null])

    expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [[stationId]])
  })

  it('returns an empty array when no rows match (non-PRINTER stations remain excluded)', async () => {
    dataSource.query.mockResolvedValue([])

    const result = await adapter.resolvePrinterStations([UuidMother.random()])

    expect(result).toEqual([])
  })
})
