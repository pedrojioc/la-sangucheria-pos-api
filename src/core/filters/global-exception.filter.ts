import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Response } from 'express'

interface ErrorResponse {
  statusCode: number
  timestamp: string
  path: string
  error: string
  message: string
  stack?: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'InternalServerError'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as any
        message = response.message || response.error || message
        error = response.error || exception.constructor.name
      }
    } else if (exception instanceof Error) {
      message = exception.message
      error = exception.constructor.name
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack
    }

    // Log the exception
    this.logger.error(`${request.method} ${request.url}`, {
      statusCode: status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
      body: request.body,
      query: request.query,
      params: request.params
    })

    response.status(status).json(errorResponse)
  }
}
