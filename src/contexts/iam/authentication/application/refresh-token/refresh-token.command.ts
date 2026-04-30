export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly userId: string,
    public readonly jti: string,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null
  ) {}
}
