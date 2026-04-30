export interface EmployeeData {
  id: string
  firstName: string
  lastName: string
  positionId: string | null
}

export interface RoleData {
  id: string
  name: string
}

export class UserListResponse {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly role: RoleData,
    public readonly isActive: boolean,
    public readonly isEmailVerified: boolean,
    public readonly createdAt: Date,
    public readonly lastLoginAt: Date | null,
    public readonly employee: EmployeeData | null
  ) {}
}
