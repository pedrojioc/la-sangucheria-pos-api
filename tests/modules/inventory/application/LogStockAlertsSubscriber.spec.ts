import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('LogStockAlertsSubscriber', () => {
  let subscriber: LogStockAlertsSubscriber
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    subscriber = new LogStockAlertsSubscriber()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('subscribedTo', () => {
    it('should subscribe to LowStockDetectedEvent and OutOfStockEvent', () => {
      const events = subscriber.subscribedTo()

      expect(events).toContain(LowStockDetectedEvent)
      expect(events).toContain(OutOfStockEvent)
      expect(events).toHaveLength(2)
    })
  })

  describe('on', () => {
    it('should log alert when LowStockDetectedEvent is received', async () => {
      const event = new LowStockDetectedEvent({
        ingredientId: UuidMother.random(),
        currentQuantity: 5,
        minimumStock: 10,
        unitId: UuidMother.random()
      })

      await subscriber.on(event)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('LOW STOCK ALERT')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(event.payload.ingredientId)
      )
    })

    it('should log alert when OutOfStockEvent is received', async () => {
      const event = new OutOfStockEvent({
        ingredientId: UuidMother.random(),
        unitId: UuidMother.random()
      })

      await subscriber.on(event)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('OUT OF STOCK ALERT')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(event.payload.ingredientId)
      )
    })

    it('should handle LowStockDetectedEvent with different stock levels', async () => {
      const event = new LowStockDetectedEvent({
        ingredientId: UuidMother.random(),
        currentQuantity: 2,
        minimumStock: 20,
        unitId: UuidMother.random()
      })

      await subscriber.on(event)

      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })
})
