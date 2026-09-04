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
import { CreatePositionRequest } from '../dto/create-position.request'
import { UpdatePositionRequest } from '../dto/update-position.request'
import { CreatePosition } from '../../../application/create/create-position'
import { UpdatePosition } from '../../../application/update/update-position'
import { DeletePosition } from '../../../application/delete/delete-position'
import { FindPosition } from '../../../application/find/find-position'
import { FindAllPositions } from '../../../application/find-all/find-all-positions'
import { PositionResponse } from '../../../application/dto/position.response'

@Controller('positions')
export class PositionController {
  constructor(
    private readonly createPosition: CreatePosition,
    private readonly updatePosition: UpdatePosition,
    private readonly deletePosition: DeletePosition,
    private readonly findPosition: FindPosition,
    private readonly findAllPositions: FindAllPositions
  ) {}

  @Post()
  async create(@Body() dto: CreatePositionRequest): Promise<void> {
    await this.createPosition.run(
      dto.id,
      dto.name,
      dto.description ?? null,
      dto.color ?? null,
      dto.icon ?? null
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePositionRequest): Promise<void> {
    await this.updatePosition.run(
      id,
      dto.name,
      dto.description ?? null,
      dto.color ?? null,
      dto.icon ?? null
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deletePosition.run(id)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PositionResponse> {
    return PositionResponse.fromDomain(await this.findPosition.run(id))
  }

  @Get()
  async findAll(): Promise<PositionResponse[]> {
    return (await this.findAllPositions.run()).map(PositionResponse.fromDomain)
  }
}
