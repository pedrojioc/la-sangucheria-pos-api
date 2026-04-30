import { CriteriaRequest } from '@/shared/presentation/dto/criteria.request'

/**
 * SearchPurchaseOrdersRequest - Request DTO
 *
 * Hereda de CriteriaRequest que maneja:
 * - page: number (default 1)
 * - pageSize: number (default 20, max 100)
 * - filters: Record<string, any> (soporta supplierName, orderNumber, status, fechas, etc.)
 * - orderBy: string
 * - orderType: 'asc' | 'desc'
 * - toCriteria(): Criteria (convierte query params → Criteria object)
 *
 * Ejemplos de uso:
 * - GET /purchase-orders?page=1&pageSize=20
 * - GET /purchase-orders?filters[supplierName]=contains:Distribuidora
 * - GET /purchase-orders?filters[orderNumber]=contains:2024
 * - GET /purchase-orders?filters[status]=PENDING_APPROVAL
 * - GET /purchase-orders?filters[requestedDate]=gte:2024-01-01&orderBy=requestedDate&orderType=desc
 *
 * Filtros con múltiples valores (OR condition):
 * - GET /purchase-orders?filters[status]=in:PARTIALLY_RECEIVED,CLOSED
 * - GET /purchase-orders?filters[status]=in:PENDING,APPROVED,SENT&filters[supplierName]=contains:Acme
 * - GET /purchase-orders?filters[id]=not_in:uuid-1,uuid-2
 *
 * SQL generado con IN:
 * WHERE status IN ('PARTIALLY_RECEIVED', 'CLOSED')  -- OR condition
 * WHERE status IN ('PENDING', 'APPROVED', 'SENT') AND supplierName ILIKE '%Acme%'
 */
export class SearchPurchaseOrdersRequest extends CriteriaRequest {}
