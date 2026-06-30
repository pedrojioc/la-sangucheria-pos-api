import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post
} from '@nestjs/common'

import { CreateStation } from '../../../application/create/create-station'
import { UpdateStation } from '../../../application/update/update-station'
import { FindStation } from '../../../application/find/find-station'
import { FindAllStations } from '../../../application/find-all/find-all-stations'
import { DeleteStation } from '../../../application/delete/delete-station'
import { StationResponse } from '../../../application/dto/station.response'
import { CreateStationRequest } from '../dto/create-station.request'
import { UpdateStationRequest } from '../dto/update-station.request'

@Controller('stations')
export class StationController {
  constructor(
    private readonly createStation: CreateStation,
    private readonly updateStation: UpdateStation,
    private readonly findStation: FindStation,
    private readonly findAllStations: FindAllStations,
    private readonly deleteStation: DeleteStation
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStationRequest): Promise<void> {
    await this.createStation.run({
      id: dto.id,
      name: dto.name,
      displayOrder: dto.displayOrder,
      color: dto.color ?? null,
      outputDevice: dto.outputDevice,
      printerAddress: dto.printerAddress ?? null
    })
  }

  @Get()
  async findAll(): Promise<StationResponse[]> {
    const stations = await this.findAllStations.run()
    return stations.map(StationResponse.fromAggregate)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<StationResponse> {
    const station = await this.findStation.run(id)
    return StationResponse.fromAggregate(station)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateStationRequest): Promise<void> {
    await this.updateStation.run(id, {
      name: dto.name,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
      color: dto.color ?? null,
      outputDevice: dto.outputDevice,
      printerAddress: dto.printerAddress ?? null
    })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteStation.run(id)
  }
}
