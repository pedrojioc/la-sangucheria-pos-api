import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Put } from '@nestjs/common'

import { GetBillingConfig } from '@contexts/billing/billing-config/application/get-billing-config/get-billing-config'
import { UpdateBillingConfig } from '@contexts/billing/billing-config/application/update-billing-config/update-billing-config'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { BillingConfigResponse } from './dtos/billing-config.response'
import { UpdateBillingConfigRequest } from './dtos/update-billing-config.request'
import { Uuid } from '@shared/domain/value-objects/uuid'

@Controller('billing-config')
export class BillingConfigController {
  constructor(
    private readonly getBillingConfig: GetBillingConfig,
    private readonly updateBillingConfig: UpdateBillingConfig
  ) {}

  @Get()
  async get(): Promise<BillingConfigResponse> {
    try {
      const primitives = await this.getBillingConfig.run()
      return BillingConfigResponse.fromPrimitives(primitives)
    } catch (error) {
      if (error instanceof BillingNotConfigured) {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Body() dto: UpdateBillingConfigRequest): Promise<void> {
    await this.updateBillingConfig.run({
      id: Uuid.random().value,
      factusApiToken: dto.factusApiToken,
      factusApiBaseUrl: dto.factusApiBaseUrl,
      factusTestMode: dto.factusTestMode,
      resolucionPrefix: dto.resolucionPrefix,
      resolucionFrom: dto.resolucionFrom,
      resolucionTo: dto.resolucionTo,
      resolucionValidFrom: new Date(dto.resolucionValidFrom),
      resolucionValidTo: new Date(dto.resolucionValidTo)
    })
  }
}
