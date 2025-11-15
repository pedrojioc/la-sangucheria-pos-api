import { Injectable } from '@nestjs/common'
import { CommandBus as NestCommandBus } from '@nestjs/cqrs'

import { CommandBus } from '@/shared/application/bus/command-bus'
import { Command } from '@/shared/application/bus/command'

@Injectable()
export class NestCommandBusAdapter implements CommandBus {
  constructor(private readonly nestCommandBus: NestCommandBus) {}

  async dispatch(command: Command): Promise<void> {
    await this.nestCommandBus.execute(command)
  }
}
