import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put
} from '@nestjs/common'

import { CreateFloorElement } from '../../../application/create/create-floor-element'
import { UpdateFloorElement } from '../../../application/update/update-floor-element'
import { DeleteFloorElement } from '../../../application/delete/delete-floor-element'
import { FindAllFloorElements } from '../../../application/find-all/find-all-floor-elements'
import { FindAllFloorElementsByZone } from '../../../application/find-all-by-zone/find-all-floor-elements-by-zone'
import { FloorElementResponse } from '../../../application/dto/floor-element.response'
import { CreateFloorElementRequest } from '../dto/create-floor-element.request'
import { UpdateFloorElementRequest } from '../dto/update-floor-element.request'

@Controller('floor-elements')
export class FloorElementController {
  constructor(
    private readonly createFloorElement: CreateFloorElement,
    private readonly updateFloorElement: UpdateFloorElement,
    private readonly deleteFloorElement: DeleteFloorElement,
    private readonly findAllFloorElements: FindAllFloorElements,
    private readonly findAllFloorElementsByZone: FindAllFloorElementsByZone
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateFloorElementRequest): Promise<void> {
    await this.createFloorElement.run(
      dto.id,
      dto.zoneId,
      dto.type,
      dto.label ?? null,
      dto.positionX,
      dto.positionY,
      dto.width,
      dto.height,
      dto.rotation ?? 0,
      dto.color ?? null
    )
  }

  @Get()
  async findAll(): Promise<FloorElementResponse[]> {
    const elements = await this.findAllFloorElements.run()
    return elements.map(FloorElementResponse.fromAggregate)
  }

  @Get('by-zone/:zoneId')
  async findAllByZone(@Param('zoneId') zoneId: string): Promise<FloorElementResponse[]> {
    const elements = await this.findAllFloorElementsByZone.run(zoneId)
    return elements.map(FloorElementResponse.fromAggregate)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateFloorElementRequest): Promise<void> {
    await this.updateFloorElement.run(id, {
      type: dto.type,
      label: dto.label,
      positionX: dto.positionX,
      positionY: dto.positionY,
      width: dto.width,
      height: dto.height,
      rotation: dto.rotation,
      color: dto.color,
      isActive: dto.isActive
    })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteFloorElement.run(id)
  }
}
