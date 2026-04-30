export class LoginCommand {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null
  ) {}
}
