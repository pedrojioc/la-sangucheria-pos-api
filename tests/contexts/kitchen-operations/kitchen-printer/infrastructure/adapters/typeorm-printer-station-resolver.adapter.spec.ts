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

  it('queries only stations configured as printer and maps NETWORK rows to the port shape (regression)', async () => {
    const stationId = UuidMother.random()

    dataSource.query.mockResolvedValue([
      {
        id: stationId,
        name: 'Parrilla',
        printer_address: '192.168.1.10',
        connection_type: 'network',
        usb_identifier: null
      }
    ])

    const result = await adapter.resolvePrinterStations([stationId])

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("output_device = 'printer'"),
      [[stationId]]
    )
    expect(result).toEqual([
      {
        stationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      }
    ])
  })

  it('does NOT filter on printer_address IS NOT NULL (bug fix) and returns USB-only stations', async () => {
    const stationId = UuidMother.random()

    dataSource.query.mockResolvedValue([
      {
        id: stationId,
        name: 'Caja USB',
        printer_address: null,
        connection_type: 'usb',
        usb_identifier: 'USB001'
      }
    ])

    const result = await adapter.resolvePrinterStations([stationId])

    const [sql] = dataSource.query.mock.calls[0]
    expect(sql).not.toMatch(/printer_address IS NOT NULL/)
    expect(result).toEqual([
      {
        stationId,
        stationName: 'Caja USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'USB001'
      }
    ])
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
