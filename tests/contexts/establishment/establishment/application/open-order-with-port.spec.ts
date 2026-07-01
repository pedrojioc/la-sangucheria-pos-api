import { OpenOrder } from '@contexts/orders/order/application/open/open-order'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { EventBus } from '@shared/domain/events'
import { EstablishmentSettingsPort } from '@contexts/orders/order/application/ports/establishment-settings.port'
import { EstablishmentNotConfigured } from '@contexts/establishment/establishment/domain/exceptions/establishment-not-configured.exception'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { Order } from '@contexts/orders/order/domain/order'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { TaxType } from '@shared/domain/value-objects/tax-type'

describe('OpenOrder — EstablishmentSettingsPort integration', () => {
  let useCase: OpenOrder
  let orderRepository: jest.Mocked<OrderRepository>
  let eventBus: jest.Mocked<EventBus>
  let establishmentPort: jest.Mocked<EstablishmentSettingsPort>

  beforeEach(() => {
    orderRepository = {
      save: jest.fn(),
      search: jest.fn(),
      nextOrderNumber: jest.fn(),
      searchWithActiveKitchenItems: jest.fn()
    } as jest.Mocked<OrderRepository>

    eventBus = {
      publish: jest.fn(),
      addSubscribers: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    establishmentPort = {
      resolve: jest.fn()
    } as jest.Mocked<EstablishmentSettingsPort>

    useCase = new OpenOrder(orderRepository, eventBus, establishmentPort)
  })

  describe('happy path', () => {
    it('should create an Order with the resolved currency and tax config from the port', async () => {
      const orderId = UuidMother.random()
      const orderNumber = 'ORD-0001'

      orderRepository.nextOrderNumber.mockResolvedValue(orderNumber)
      orderRepository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)
      establishmentPort.resolve.mockResolvedValue({
        currency: 'USD',
        taxRate: 0.10,
        taxType: TaxType.IVA,
        taxInclusive: false
      })

      await useCase.run(orderId, OrderType.DINE_IN, UuidMother.random(), null)

      expect(orderRepository.save).toHaveBeenCalledTimes(1)
      const savedOrder = orderRepository.save.mock.calls[0][0] as Order
      const p = savedOrder.toPrimitives()
      expect(p.currency).toBe('USD')
      expect(p.taxConfig.rate).toBe(0.10)
      expect(p.taxConfig.inclusive).toBe(false)
    })

    it('should publish domain events after saving the order', async () => {
      orderRepository.nextOrderNumber.mockResolvedValue('ORD-0002')
      orderRepository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)
      establishmentPort.resolve.mockResolvedValue({
        currency: 'USD',
        taxRate: 0.10,
        taxType: TaxType.IVA,
        taxInclusive: false
      })

      await useCase.run(UuidMother.random(), OrderType.TAKEOUT, UuidMother.random(), null)

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('should return the order number from the repository', async () => {
      orderRepository.nextOrderNumber.mockResolvedValue('ORD-0099')
      orderRepository.save.mockResolvedValue(undefined)
      eventBus.publish.mockResolvedValue(undefined)
      establishmentPort.resolve.mockResolvedValue({
        currency: 'COP',
        taxRate: 0.08,
        taxType: TaxType.INC,
        taxInclusive: true
      })

      const result = await useCase.run(UuidMother.random(), OrderType.DINE_IN, UuidMother.random(), null)

      expect(result).toBe('ORD-0099')
    })
  })

  describe('port throws EstablishmentNotConfigured', () => {
    it('should propagate the exception and NOT save any Order', async () => {
      establishmentPort.resolve.mockRejectedValue(new EstablishmentNotConfigured())

      await expect(
        useCase.run(UuidMother.random(), OrderType.DINE_IN, UuidMother.random(), null)
      ).rejects.toThrow(EstablishmentNotConfigured)

      expect(orderRepository.save).not.toHaveBeenCalled()
    })

    it('should NOT publish any events when the port throws', async () => {
      establishmentPort.resolve.mockRejectedValue(new EstablishmentNotConfigured())

      await expect(
        useCase.run(UuidMother.random(), OrderType.DINE_IN, UuidMother.random(), null)
      ).rejects.toThrow()

      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })
})
