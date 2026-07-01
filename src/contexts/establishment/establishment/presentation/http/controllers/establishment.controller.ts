import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common'

import { GetEstablishmentSettings } from '../../../application/get-settings/get-establishment-settings'
import { UpdateEstablishmentSettings } from '../../../application/update-settings/update-establishment-settings'
import { EstablishmentSettingsResponse } from '../../../application/dto/establishment-settings.response'
import { UpdateEstablishmentSettingsDto } from '../dto/update-establishment-settings.dto'

@Controller('establishment')
export class EstablishmentController {
  constructor(
    private readonly getSettings: GetEstablishmentSettings,
    private readonly updateSettings: UpdateEstablishmentSettings
  ) {}

  @Get('settings')
  async getEstablishmentSettings(): Promise<EstablishmentSettingsResponse> {
    return this.getSettings.run()
  }

  @Patch('settings')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateEstablishmentSettings(@Body() dto: UpdateEstablishmentSettingsDto): Promise<void> {
    await this.updateSettings.run(dto)
  }
}
