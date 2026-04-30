export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly roleId: string
  ) {}
}
