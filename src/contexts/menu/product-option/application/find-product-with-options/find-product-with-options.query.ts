import { IQuery } from '@nestjs/cqrs'

export class FindProductWithOptionsQuery implements IQuery {
  constructor(public readonly id: string) {}
}
