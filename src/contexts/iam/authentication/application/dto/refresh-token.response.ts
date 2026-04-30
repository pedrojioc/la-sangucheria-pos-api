export class RefreshTokenResponse {
  accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  static fromResult(result: { accessToken: string }): RefreshTokenResponse {
    return new RefreshTokenResponse(result.accessToken)
  }
}
