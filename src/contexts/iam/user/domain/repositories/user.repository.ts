import { User } from '../user'
import { UserId } from '../user-id'
import { Username } from '../username'
import { UserEmail } from '../user-email'

export abstract class UserRepository {
  abstract save(user: User): Promise<void>
  abstract search(id: UserId): Promise<User | null>
  abstract searchByUsername(username: Username): Promise<User | null>
  abstract searchByEmail(email: UserEmail): Promise<User | null>
  abstract searchAll(): Promise<User[]>
  abstract existsByUsername(username: Username): Promise<boolean>
  abstract existsByEmail(email: UserEmail): Promise<boolean>
}
