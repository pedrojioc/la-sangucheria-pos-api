import { NotFoundException } from '@nestjs/common'

import { BillingConfigController } from '@contexts/billing/billing-config/presentation/billing-config.controller'
import { GetBillingConfig } from '@contexts/billing/billing-config/application/get-billing-config/get-billing-config'
import { UpdateBillingConfig } from '@contexts/billing/billing-config/application/update-billing-config/update-billing-config'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { BillingConfigResponse } from '@contexts/billing/billing-config/presentation/dtos/billing-config.response'
import { BillingConfigMother } from '../__mothers__/billing-config.mother'

describe('BillingConfigController', () => {
  let controller: BillingConfigController
  let mockGetBillingConfig: jest.Mocked<GetBillingConfig>
  let mockUpdateBillingConfig: jest.Mocked<UpdateBillingConfig>

  beforeEach(() => {
    mockGetBillingConfig = {
      run: jest.fn()
    } as unknown as jest.Mocked<GetBillingConfig>

    mockUpdateBillingConfig = {
      run: jest.fn()
    } as unknown as jest.Mocked<UpdateBillingConfig>

    controller = new BillingConfigController(mockGetBillingConfig, mockUpdateBillingConfig)
  })

  describe('GET /billing-config', () => {
    it('should return 200 with mapped BillingConfigResponse when config exists', async () => {
      // Arrange
      const primitives = BillingConfigMother.primitives()
      mockGetBillingConfig.run.mockResolvedValue(primitives)

      // Act
      const result = await controller.get()

      // Assert
      expect(result).toBeInstanceOf(BillingConfigResponse)
      expect(result.factusApiToken).toBe(primitives.factusApiToken)
      expect(result.factusApiBaseUrl).toBe(primitives.factusApiBaseUrl)
      expect(result.factusTestMode).toBe(primitives.factusTestMode)
      expect(result.resolucionPrefix).toBe(primitives.resolucionPrefix)
      expect(result.resolucionFrom).toBe(primitives.resolucionFrom)
      expect(result.resolucionTo).toBe(primitives.resolucionTo)
      expect(result.resolucionValidFrom).toBe(primitives.resolucionValidFrom.toISOString())
      expect(result.resolucionValidTo).toBe(primitives.resolucionValidTo.toISOString())
      expect(mockGetBillingConfig.run).toHaveBeenCalledTimes(1)
    })

    it('should throw NotFoundException when BillingNotConfigured is thrown', async () => {
      // Arrange
      mockGetBillingConfig.run.mockRejectedValue(new BillingNotConfigured())

      // Act & Assert
      await expect(controller.get()).rejects.toThrow(NotFoundException)
    })

    it('should rethrow unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Database connection lost')
      mockGetBillingConfig.run.mockRejectedValue(unexpectedError)

      // Act & Assert
      await expect(controller.get()).rejects.toThrow('Database connection lost')
    })
  })

  describe('PUT /billing-config', () => {
    it('should call UpdateBillingConfig with correct params and return no content', async () => {
      // Arrange
      mockUpdateBillingConfig.run.mockResolvedValue(undefined)

      const dto = {
        factusApiToken: 'test-token',
        factusApiBaseUrl: 'https://api-sandbox.factus.com.co',
        factusTestMode: true,
        resolucionPrefix: 'SETP',
        resolucionFrom: 1,
        resolucionTo: 1000,
        resolucionValidFrom: '2025-01-01T00:00:00.000Z',
        resolucionValidTo: '2025-12-31T23:59:59.000Z'
      }

      // Act
      const result = await controller.update(dto)

      // Assert
      expect(result).toBeUndefined()
      expect(mockUpdateBillingConfig.run).toHaveBeenCalledWith(
        expect.objectContaining({
          factusApiToken: dto.factusApiToken,
          factusApiBaseUrl: dto.factusApiBaseUrl,
          factusTestMode: dto.factusTestMode,
          resolucionPrefix: dto.resolucionPrefix,
          resolucionFrom: dto.resolucionFrom,
          resolucionTo: dto.resolucionTo,
          resolucionValidFrom: new Date(dto.resolucionValidFrom),
          resolucionValidTo: new Date(dto.resolucionValidTo)
        })
      )
    })
  })
})
