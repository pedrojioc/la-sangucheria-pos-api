import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'

import { CreateTable } from '../../../application/create/create-table'
import { UpdateTable } from '../../../application/update/update-table'
import { MoveTable } from '../../../application/move/move-table'
import { FindTable } from '../../../application/find/find-table'
import { FindAllTablesWithOrders } from '../../../application/find-all-with-orders/find-all-tables-with-orders'
import { ChangeTableStatus } from '../../../application/change-status/change-table-status'
import { TableResponse } from '../../../application/dto/table.response'
import { TableWithOrderResponse } from '../../../application/dto/table-with-order.response'
import { CreateTableRequest } from '../dto/create-table.request'
import { UpdateTableRequest } from '../dto/update-table.request'
import { MoveTableRequest } from '../dto/move-table.request'
import { ChangeTableStatusRequest } from '../dto/change-table-status.request'

@Controller('tables')
export class TableController {
  constructor(
    private readonly createTable: CreateTable,
    private readonly updateTable: UpdateTable,
    private readonly moveTable: MoveTable,
    private readonly findTable: FindTable,
    private readonly findAllTablesWithOrders: FindAllTablesWithOrders,
    private readonly changeTableStatus: ChangeTableStatus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTableRequest): Promise<void> {
    await this.createTable.run(
      dto.id,
      dto.number,
      dto.capacity,
      dto.shape,
      dto.zoneId,
      dto.positionX,
      dto.positionY,
      dto.rotation
    )
  }

  @Get()
  async findAll(): Promise<TableWithOrderResponse[]> {
    return this.findAllTablesWithOrders.run()
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<TableResponse> {
    const table = await this.findTable.run(id)
    return TableResponse.fromAggregate(table)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateTableRequest): Promise<void> {
    await this.updateTable.run(
      id,
      dto.number,
      dto.capacity,
      dto.shape,
      dto.zoneId,
      dto.positionX,
      dto.positionY,
      dto.rotation
    )
  }

  @Patch(':id/position')
  @HttpCode(HttpStatus.OK)
  async move(@Param('id') id: string, @Body() dto: MoveTableRequest): Promise<void> {
    await this.moveTable.run(id, dto.positionX ?? null, dto.positionY ?? null, dto.rotation)
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeTableStatusRequest
  ): Promise<void> {
    await this.changeTableStatus.run(id, dto.status)
  }
}
