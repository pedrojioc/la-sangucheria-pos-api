import { Module } from '@nestjs/common'

import { BillingConfigModule } from '@contexts/billing/billing-config/billing-config.module'
import { InvoiceModule } from '@contexts/billing/invoice/invoice.module'

@Module({
  imports: [BillingConfigModule, InvoiceModule]
})
export class BillingModule {}
