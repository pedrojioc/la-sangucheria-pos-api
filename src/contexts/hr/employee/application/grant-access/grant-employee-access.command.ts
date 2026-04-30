export class GrantEmployeeAccessCommand {
  constructor(
    public readonly employeeId: string,
    public readonly userId: string,
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly roleId: string
  ) {}
}
