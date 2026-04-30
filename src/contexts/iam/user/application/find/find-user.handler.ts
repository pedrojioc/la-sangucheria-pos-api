import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindUserQuery } from './find-user.query'
import { FindUser } from './find-user'
import { UserResponse } from '../dto/user.response'

@QueryHandler(FindUserQuery)
export class FindUserHandler implements IQueryHandler<FindUserQuery> {
  constructor(private readonly useCase: FindUser) {}

  async execute(query: FindUserQuery): Promise<UserResponse> {
    const user = await this.useCase.run(query.id)
    return UserResponse.fromDomain(user)
  }
}
