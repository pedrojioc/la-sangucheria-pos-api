export class LoginResponse {
  accessToken: string
  user: {
    id: string
    username: string
    email: string
  }

  constructor(accessToken: string, user: { id: string; username: string; email: string }) {
    this.accessToken = accessToken
    this.user = user
  }

  static fromLoginResult(result: {
    accessToken: string
    user: { id: string; username: string; email: string }
  }): LoginResponse {
    return new LoginResponse(result.accessToken, result.user)
  }
}
