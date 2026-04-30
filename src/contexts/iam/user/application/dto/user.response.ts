import { User } from '../../domain/user'

export class UserResponse {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly roleId: string,
    public readonly isActive: boolean,
    public readonly isEmailVerified: boolean,
    public readonly createdAt: Date,
    public readonly lastLoginAt: Date | null
  ) {}

  static fromDomain(user: User): UserResponse {
    const p = user.toPrimitives()
    return new UserResponse(
      p.id,
      p.username,
      p.email,
      p.fullName,
      p.roleId,
      p.isActive,
      p.isEmailVerified,
      p.createdAt,
      p.lastLoginAt
    )
  }
}
