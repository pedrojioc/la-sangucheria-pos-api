import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'
import {
  DomainException,
  InvalidValueObjectException,
  BusinessRuleViolationException,
  NotFoundException
} from '../../shared/domain/exceptions/domain.exception'

interface ErrorResponse {
  statusCode: number
  timestamp: string
  path: string
  error: string
  message: string
  details?: any
}

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name)

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    const status = this.getHttpStatus(exception)
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception.constructor.name,
      message: exception.message
    }

    // Add specific details for InvalidValueObjectException
    if (exception instanceof InvalidValueObjectException) {
      errorResponse.details = {
        field: exception.message.split(':')[0]?.replace('Invalid ', '')
      }
    }

    // Log the exception
    this.logger.error(`Domain Exception: ${exception.constructor.name}`, {
      message: exception.message,
      stack: exception.stack,
      path: request.url,
      method: request.method
    })

    response.status(status).json(errorResponse)
  }

  private getHttpStatus(exception: DomainException): HttpStatus {
    if (exception instanceof InvalidValueObjectException) {
      return HttpStatus.BAD_REQUEST
    }

    if (exception instanceof BusinessRuleViolationException) {
      return HttpStatus.UNPROCESSABLE_ENTITY
    }

    if (exception instanceof NotFoundException) {
      return HttpStatus.NOT_FOUND
    }

    // Default for other domain exceptions
    return HttpStatus.UNPROCESSABLE_ENTITY
  }
}
