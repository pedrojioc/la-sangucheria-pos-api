import { UserRepository } from '../../domain/repositories/user.repository'
import { UserNotFound } from '../../domain/exceptions/user-not-found.exception'
import { UserId } from '../../domain/user-id'
import { Username } from '../../domain/username'
import { UserEmail } from '../../domain/user-email'
import { UserAlreadyExists } from '../../domain/exceptions/user-already-exists.exception'

export class UpdateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async run(
    id: string,
    username: string,
    email: string,
    fullName: string | null,
    roleId: string
  ): Promise<void> {
    const user = await this.userRepository.search(new UserId(id))
    if (!user) throw new UserNotFound(id)

    const usernameVO = new Username(username)
    const emailVO = new UserEmail(email)

    // Check username uniqueness only if it changed
    if (user.getUsername() !== username) {
      const existsByUsername = await this.userRepository.existsByUsername(usernameVO)
      if (existsByUsername) throw new UserAlreadyExists('username', username)
    }

    // Check email uniqueness only if it changed
    if (user.getEmail() !== email) {
      const existsByEmail = await this.userRepository.existsByEmail(emailVO)
      if (existsByEmail) throw new UserAlreadyExists('email', email)
    }

    user.update(username, email, fullName, roleId)
    await this.userRepository.save(user)
  }
}
