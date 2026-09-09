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

import { CreateUnitRequest } from '../dto/create-unit.request'
import { UpdateUnitRequest } from '../dto/update-unit.request'
import { CreateUnit } from '@/contexts/shared-kernel/unit/application/create/create-unit'
import { UpdateUnit } from '@/contexts/shared-kernel/unit/application/update/update-unit'
import { DeleteUnit } from '@/contexts/shared-kernel/unit/application/delete/delete-unit'
import { FindUnit } from '@/contexts/shared-kernel/unit/application/find/find-unit'
import { FindAllUnits } from '@/contexts/shared-kernel/unit/application/find-all/find-all-units'
import { FindUnitConversions } from '@/contexts/shared-kernel/unit/application/find-conversions/find-unit-conversions'
import { UnitResponse } from '@/contexts/shared-kernel/unit/application/dto/unit.response'
import { UnitListResponse } from '@/contexts/shared-kernel/unit/application/dto/unit-list.response'
import { UnitConversionListItemResponse } from '@/contexts/shared-kernel/unit/application/dto/unit-conversion-list-item.response'

@Controller('units')
export class UnitsController {
  constructor(
    private readonly createUnit: CreateUnit,
    private readonly updateUnit: UpdateUnit,
    private readonly deleteUnit: DeleteUnit,
    private readonly findUnit: FindUnit,
    private readonly findAllUnits: FindAllUnits,
    private readonly findUnitConversions: FindUnitConversions
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUnitRequest): Promise<void> {
    await this.createUnit.run(dto.id, dto.name, dto.symbol, dto.type, dto.isActive)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateUnitRequest): Promise<void> {
    await this.updateUnit.run(id, dto.name, dto.symbol, dto.type, dto.isActive)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUnit.run(id)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UnitResponse> {
    const unit = await this.findUnit.run(id)
    return UnitResponse.fromDomain(unit)
  }

  @Get()
  async findAll(): Promise<UnitListResponse> {
    const units = await this.findAllUnits.run()
    return UnitListResponse.fromDomain(units)
  }

  @Get(':id/conversions')
  async findConversions(@Param('id') id: string): Promise<UnitConversionListItemResponse[]> {
    const items = await this.findUnitConversions.run(id)
    return items.map(UnitConversionListItemResponse.fromReadModel)
  }
}
