export abstract class InfrastructureException extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name

    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }
}
