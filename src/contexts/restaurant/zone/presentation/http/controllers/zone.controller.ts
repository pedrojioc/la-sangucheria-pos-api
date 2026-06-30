import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'

import { CreateZone } from '../../../application/create/create-zone'
import { UpdateZone } from '../../../application/update/update-zone'
import { FindZone } from '../../../application/find/find-zone'
import { FindAllZones } from '../../../application/find-all/find-all-zones'
import { ZoneResponse } from '../../../application/dto/zone.response'
import { CreateZoneRequest } from '../dto/create-zone.request'
import { UpdateZoneRequest } from '../dto/update-zone.request'

@Controller('zones')
export class ZoneController {
  constructor(
    private readonly createZone: CreateZone,
    private readonly updateZone: UpdateZone,
    private readonly findZone: FindZone,
    private readonly findAllZones: FindAllZones
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateZoneRequest): Promise<void> {
    await this.createZone.run(dto.id, dto.name, dto.color, dto.sortIndex)
  }

  @Get()
  async findAll(): Promise<ZoneResponse[]> {
    const zones = await this.findAllZones.run()
    return zones.map(ZoneResponse.fromAggregate)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ZoneResponse> {
    const zone = await this.findZone.run(id)
    return ZoneResponse.fromAggregate(zone)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateZoneRequest): Promise<void> {
    await this.updateZone.run(id, dto.name, dto.color, dto.sortIndex, dto.isActive)
  }
}
