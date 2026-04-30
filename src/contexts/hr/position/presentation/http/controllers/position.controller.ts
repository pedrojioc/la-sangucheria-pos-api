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
import { CreatePositionRequest } from '../dto/create-position.request'
import { UpdatePositionRequest } from '../dto/update-position.request'
import { CreatePositionCommand } from '../../../application/create/create-position.command'
import { UpdatePositionCommand } from '../../../application/update/update-position.command'
import { DeletePositionCommand } from '../../../application/delete/delete-position.command'
import { FindPositionQuery } from '../../../application/find/find-position.query'
import { FindAllPositionsQuery } from '../../../application/find-all/find-all-positions.query'
import { PositionResponse } from '../../../application/dto/position.response'

@Controller('positions')
export class PositionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreatePositionRequest): Promise<void> {
    await this.commandBus.execute(
      new CreatePositionCommand(
        dto.id,
        dto.name,
        dto.description ?? null,
        dto.color ?? null,
        dto.icon ?? null
      )
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePositionRequest): Promise<void> {
    await this.commandBus.execute(
      new UpdatePositionCommand(
        id,
        dto.name,
        dto.description ?? null,
        dto.color ?? null,
        dto.icon ?? null
      )
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeletePositionCommand(id))
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PositionResponse> {
    return this.queryBus.execute(new FindPositionQuery(id))
  }

  @Get()
  async findAll(): Promise<PositionResponse[]> {
    return this.queryBus.execute(new FindAllPositionsQuery())
  }
}
