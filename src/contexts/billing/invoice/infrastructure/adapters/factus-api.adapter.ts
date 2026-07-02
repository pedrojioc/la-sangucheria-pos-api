import { Injectable } from '@nestjs/common'
import { BillingConfigPrimitives } from '@contexts/billing/billing-config/domain/billing-config'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'
import { FactusApiPort, FactusIssueResult } from '@contexts/billing/invoice/application/ports/factus-api.port'

const FACTUS_TIMEOUT_MS = 10_000

@Injectable()
export class FactusApiAdapter extends FactusApiPort {
  async issue(config: BillingConfigPrimitives, snapshot: InvoiceSnapshot): Promise<FactusIssueResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FACTUS_TIMEOUT_MS)

    const body = {
      document_type: snapshot.documentType === DocumentType.DOCUMENTO_EQUIVALENTE ? 'POS' : 'INVOICE',
      customer: {
        document_type: snapshot.customerDocumentType ?? 'CC',
        document_number: snapshot.customerDocumentNumber ?? '222222222222',
        name: snapshot.customerDocumentNumber ? 'Cliente' : 'Consumidor Final',
      },
      items: snapshot.items.map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_amount: item.taxAmount,
        line_total: item.lineTotal,
      })),
      subtotal: snapshot.subtotal,
      discount_total: snapshot.discountTotal,
      tax_amount: snapshot.taxAmount,
      currency: snapshot.currency,
    }

    let response: Response
    try {
      response = await fetch(`${config.factusApiBaseUrl}/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.factusApiToken}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const responseText = await response.text()
      const snippet = responseText.slice(0, 200)
      throw new Error(`Factus API request failed with status ${response.status}: ${snippet}`)
    }

    const data = (await response.json()) as { cufe_cude?: string; cude?: string; document_number: string }

    return {
      cufeCude: data.cufe_cude ?? data.cude ?? '',
      documentNumber: data.document_number,
    }
  }
}
