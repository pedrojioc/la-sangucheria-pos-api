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
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { CreateUnitRequest } from '../dto/create-unit.request'
import { UpdateUnitRequest } from '../dto/update-unit.request'
import { CreateUnitCommand } from '@/contexts/shared-kernel/unit/application/create/create-unit.command'
import { UpdateUnitCommand } from '@/contexts/shared-kernel/unit/application/update/update-unit.command'
import { DeleteUnitCommand } from '@/contexts/shared-kernel/unit/application/delete/delete-unit.command'
import { FindUnitQuery } from '@/contexts/shared-kernel/unit/application/find/find-unit.query'
import { FindAllUnitsQuery } from '@/contexts/shared-kernel/unit/application/find-all/find-all-units.query'
import { UnitResponse } from '@/contexts/shared-kernel/unit/application/dto/unit.response'
import { UnitListResponse } from '@/contexts/shared-kernel/unit/application/dto/unit-list.response'

@Controller('units')
export class UnitsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUnitRequest): Promise<void> {
    const command = new CreateUnitCommand(dto.id, dto.name, dto.symbol, dto.type, dto.isActive)

    await this.commandBus.execute(command)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateUnitRequest): Promise<void> {
    const command = new UpdateUnitCommand(id, dto.name, dto.symbol, dto.type, dto.isActive)

    await this.commandBus.execute(command)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteUnitCommand(id)

    await this.commandBus.execute(command)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UnitResponse> {
    const query = new FindUnitQuery(id)
    return this.queryBus.execute(query)
  }

  @Get()
  async findAll(): Promise<UnitListResponse> {
    const query = new FindAllUnitsQuery()
    return this.queryBus.execute(query)
  }
}
