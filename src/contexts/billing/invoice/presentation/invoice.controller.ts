import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UnprocessableEntityException
} from '@nestjs/common'

import { ListPendingInvoices } from '@contexts/billing/invoice/application/list-pending-invoices/list-pending-invoices'
import { RetryInvoice } from '@contexts/billing/invoice/application/retry-invoice/retry-invoice'
import { InvoiceNotExist } from '@contexts/billing/invoice/domain/exceptions/invoice-not-exist.exception'
import { InvoiceNotRetryable } from '@contexts/billing/invoice/domain/exceptions/invoice-not-retryable.exception'
import { InvoiceResponse } from '@contexts/billing/invoice/application/dto/invoice.response'

@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly listPendingInvoices: ListPendingInvoices,
    private readonly retryInvoice: RetryInvoice
  ) {}

  @Get('pending')
  async listPending(): Promise<InvoiceResponse[]> {
    const invoices = await this.listPendingInvoices.run()
    return invoices.map(InvoiceResponse.fromPrimitives)
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.NO_CONTENT)
  async retry(@Param('id') id: string): Promise<void> {
    try {
      await this.retryInvoice.run(id)
    } catch (error) {
      if (error instanceof InvoiceNotExist) {
        throw new NotFoundException(error.message)
      }
      if (error instanceof InvoiceNotRetryable) {
        throw new UnprocessableEntityException(error.message)
      }
      throw error
    }
  }
}
