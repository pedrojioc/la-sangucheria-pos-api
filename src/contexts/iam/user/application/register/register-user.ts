import { UserRepository } from '../../domain/repositories/user.repository'
import { EventBus } from '@/shared/domain/events'
import { User } from '../../domain/user'
import { Username } from '../../domain/username'
import { UserEmail } from '../../domain/user-email'
import { UserAlreadyExists } from '../../domain/exceptions/user-already-exists.exception'
import { PasswordHasher } from '../../domain/services/password-hasher'

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    username: string,
    email: string,
    plainPassword: string,
    fullName: string | null,
    roleId: string
  ): Promise<void> {
    // Check uniqueness
    const usernameVO = new Username(username)
    const emailVO = new UserEmail(email)

    const existsByUsername = await this.userRepository.existsByUsername(usernameVO)
    if (existsByUsername) {
      throw new UserAlreadyExists('username', username)
    }

    const existsByEmail = await this.userRepository.existsByEmail(emailVO)
    if (existsByEmail) {
      throw new UserAlreadyExists('email', email)
    }

    // Hash password (infrastructure service)
    const passwordHash = await this.passwordHasher.hash(plainPassword)

    // Create user
    const user = User.create(id, username, email, passwordHash, fullName, roleId)

    // Persist
    await this.userRepository.save(user)

    // Publish events
    const events = user.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
