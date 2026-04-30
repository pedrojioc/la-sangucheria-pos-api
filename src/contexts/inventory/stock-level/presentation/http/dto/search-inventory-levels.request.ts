import { CriteriaRequest } from '@/shared/presentation/dto/criteria.request'

/**
 * SearchInventoryLevelsRequest - Request DTO
 *
 * Hereda de CriteriaRequest que maneja:
 * - page: number (default 1)
 * - pageSize: number (default 20, max 100)
 * - filters: Record<string, any>
 * - orderBy: string
 * - orderType: 'asc' | 'desc'
 * - toCriteria(): Criteria
 *
 * Ejemplos de uso:
 * - GET /inventory-levels?page=1&pageSize=20
 * - GET /inventory-levels?filters[ingredientName]=contains:Tomate
 * - GET /inventory-levels?orderBy=currentQuantity&orderType=asc  (menos stock primero)
 * - GET /inventory-levels?filters[isLowStock]=true
 * - GET /inventory-levels?filters[categoryName]=contains:Verduras
 */
export class SearchInventoryLevelsRequest extends CriteriaRequest {}
