import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { UserId } from './user-id'
import { Username } from './username'
import { UserEmail } from './user-email'
import { UserPasswordHash } from './user-password-hash'
import { UserFullName } from './user-full-name'
import { UserIsActive } from './user-is-active'
import { UserIsEmailVerified } from './user-is-email-verified'
import { UserCreatedEvent } from './events/user-created.event'
import { UserLoggedInEvent } from './events/user-logged-in.event'
import { UserPasswordChangedEvent } from './events/user-password-changed.event'

export interface UserPrimitives {
  id: string
  username: string
  email: string
  passwordHash: string
  fullName: string | null
  roleId: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

export class User extends AggregateRoot {
  private constructor(
    public readonly id: UserId,
    private username: Username,
    private email: UserEmail,
    private passwordHash: UserPasswordHash,
    private fullName: UserFullName | null,
    private roleId: string,
    private isActive: UserIsActive,
    private isEmailVerified: UserIsEmailVerified,
    private createdAt: Date,
    private updatedAt: Date,
    private lastLoginAt: Date | null
  ) {
    super()
  }

  // Factory method for creating new users
  static create(
    id: string,
    username: string,
    email: string,
    passwordHash: string,
    fullName: string | null,
    roleId: string
  ): User {
    const now = new Date()
    const user = new User(
      new UserId(id),
      new Username(username),
      new UserEmail(email),
      new UserPasswordHash(passwordHash),
      fullName ? new UserFullName(fullName) : null,
      roleId,
      new UserIsActive(true),
      new UserIsEmailVerified(false),
      now,
      now,
      null
    )

    user.record(
      new UserCreatedEvent({
        userId: id,
        username,
        email,
        occurredOn: now
      })
    )

    return user
  }

  // Reconstitution from persistence
  static fromPrimitives(primitives: UserPrimitives): User {
    return new User(
      new UserId(primitives.id),
      new Username(primitives.username),
      new UserEmail(primitives.email),
      new UserPasswordHash(primitives.passwordHash),
      primitives.fullName ? new UserFullName(primitives.fullName) : null,
      primitives.roleId,
      new UserIsActive(primitives.isActive),
      new UserIsEmailVerified(primitives.isEmailVerified),
      primitives.createdAt,
      primitives.updatedAt,
      primitives.lastLoginAt
    )
  }

  // Business methods
  recordLogin(): void {
    this.lastLoginAt = new Date()
    this.record(
      new UserLoggedInEvent({
        userId: this.id.value,
        loginAt: this.lastLoginAt,
        occurredOn: this.lastLoginAt
      })
    )
  }

  changePassword(newPasswordHash: string): void {
    this.passwordHash = new UserPasswordHash(newPasswordHash)
    this.updatedAt = new Date()

    this.record(
      new UserPasswordChangedEvent({
        userId: this.id.value,
        occurredOn: new Date()
      })
    )
  }

  update(username: string, email: string, fullName: string | null, roleId: string): void {
    this.username = new Username(username)
    this.email = new UserEmail(email)
    this.fullName = fullName ? new UserFullName(fullName) : null
    this.roleId = roleId
    this.updatedAt = new Date()
  }

  deactivate(): void {
    this.isActive = new UserIsActive(false)
    this.updatedAt = new Date()
  }

  activate(): void {
    this.isActive = new UserIsActive(true)
    this.updatedAt = new Date()
  }

  verifyEmail(): void {
    this.isEmailVerified = new UserIsEmailVerified(true)
    this.updatedAt = new Date()
  }

  // Getters for domain logic
  getId(): string {
    return this.id.value
  }

  getUsername(): string {
    return this.username.value
  }

  getEmail(): string {
    return this.email.value
  }

  getPasswordHash(): string {
    return this.passwordHash.value
  }

  isUserActive(): boolean {
    return this.isActive.value
  }

  getIsActive(): boolean {
    return this.isActive.value
  }

  getRoleId(): string {
    return this.roleId
  }

  toPrimitives(): UserPrimitives {
    return {
      id: this.id.value,
      username: this.username.value,
      email: this.email.value,
      passwordHash: this.passwordHash.value,
      fullName: this.fullName?.value ?? null,
      roleId: this.roleId,
      isActive: this.isActive.value,
      isEmailVerified: this.isEmailVerified.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    }
  }
}
