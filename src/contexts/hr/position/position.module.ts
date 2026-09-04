import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PositionEntity } from './infrastructure/persistence/typeorm/position.entity'
import { PositionRepository } from './domain/repositories/position.repository'
import { TypeOrmPositionRepository } from './infrastructure/persistence/typeorm/typeorm-position.repository'
import { createProvider } from '@/core/utils/create-provider'

import { CreatePosition } from './application/create/create-position'
import { UpdatePosition } from './application/update/update-position'
import { DeletePosition } from './application/delete/delete-position'
import { FindPosition } from './application/find/find-position'
import { FindAllPositions } from './application/find-all/find-all-positions'

import { PositionController } from './presentation/http/controllers/position.controller'

@Module({
  imports: [TypeOrmModule.forFeature([PositionEntity])],
  controllers: [PositionController],
  providers: [
    { provide: PositionRepository, useClass: TypeOrmPositionRepository },
    createProvider(CreatePosition, [PositionRepository]),
    createProvider(UpdatePosition, [PositionRepository]),
    createProvider(DeletePosition, [PositionRepository]),
    createProvider(FindPosition, [PositionRepository]),
    createProvider(FindAllPositions, [PositionRepository])
  ],
  exports: [PositionRepository, FindPosition]
})
export class PositionModule {}
