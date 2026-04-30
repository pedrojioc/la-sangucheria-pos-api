export class RegisterUserCommand {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string | null,
    public readonly roleId: string
  ) {}
}
