import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common'

import { GetEstablishmentSettings } from '../../../application/get-settings/get-establishment-settings'
import { UpdateEstablishmentSettings } from '../../../application/update-settings/update-establishment-settings'
import { InitializeEstablishment } from '../../../application/initialize/initialize-establishment'
import { EstablishmentSettingsStatusResponse } from '../../../application/dto/establishment-settings-status.response'
import { UpdateEstablishmentSettingsDto } from '../dto/update-establishment-settings.dto'
import { CreateEstablishmentSettingsDto } from '../dto/create-establishment-settings.dto'
import { EstablishmentNotConfigured } from '../../../domain/exceptions/establishment-not-configured.exception'

@Controller('establishment')
export class EstablishmentController {
  constructor(
    private readonly getSettings: GetEstablishmentSettings,
    private readonly updateSettings: UpdateEstablishmentSettings,
    private readonly initializeEstablishment: InitializeEstablishment
  ) {}

  @Get('settings')
  async getEstablishmentSettings(): Promise<EstablishmentSettingsStatusResponse> {
    try {
      const settings = await this.getSettings.run()
      return EstablishmentSettingsStatusResponse.configured(settings)
    } catch (error) {
      if (error instanceof EstablishmentNotConfigured) {
        return EstablishmentSettingsStatusResponse.notConfigured()
      }
      throw error
    }
  }

  @Post('settings')
  @HttpCode(HttpStatus.NO_CONTENT)
  async createEstablishmentSettings(@Body() dto: CreateEstablishmentSettingsDto): Promise<void> {
    await this.initializeEstablishment.run({
      id: dto.id,
      name: dto.name,
      displayName: dto.displayName,
      legalName: dto.legalName,
      taxId: dto.taxId,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      logoUrl: dto.logoUrl ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      defaultCurrency: dto.defaultCurrency,
      defaultTaxRate: dto.defaultTaxRate,
      defaultTaxType: dto.defaultTaxType,
      taxInclusive: dto.taxInclusive,
      receiptHeader: dto.receiptHeader ?? null,
      receiptFooter: dto.receiptFooter ?? null,
      timezone: dto.timezone,
      locale: dto.locale,
      loyaltyEnabled: dto.loyaltyEnabled
    })
  }

  @Patch('settings')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateEstablishmentSettings(@Body() dto: UpdateEstablishmentSettingsDto): Promise<void> {
    await this.updateSettings.run(dto)
  }
}
