import { UserRepository } from '../../domain/repositories/user.repository'
import { User } from '../../domain/user'
import { UserId } from '../../domain/user-id'
import { UserNotFound } from '../../domain/exceptions/user-not-found.exception'

export class FindUser {
  constructor(private readonly userRepository: UserRepository) {}

  async run(id: string): Promise<User> {
    const user = await this.userRepository.search(new UserId(id))

    if (!user) {
      throw new UserNotFound(id)
    }

    return user
  }
}
