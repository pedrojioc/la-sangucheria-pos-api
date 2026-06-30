import { IQuery } from '@nestjs/cqrs'

export class FindUnitConversionsQuery implements IQuery {
  constructor(public readonly unitId: string) {}
}
