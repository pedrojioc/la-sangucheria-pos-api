import { UserRepository } from '../../domain/repositories/user.repository'
import { UserNotFound } from '../../domain/exceptions/user-not-found.exception'
import { UserId } from '../../domain/user-id'

export class DeactivateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async run(id: string): Promise<void> {
    const user = await this.userRepository.search(new UserId(id))
    if (!user) throw new UserNotFound(id)

    user.deactivate()
    await this.userRepository.save(user)
  }
}
