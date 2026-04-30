import { Criteria } from '@/shared/domain/criteria/criteria'
import { InventoryLevelSearchResult } from '../dto/inventory-level-search-result'

/**
 * InventoryLevelQueryService - Abstract Query Service
 *
 * Servicio de consultas para operaciones de LECTURA de niveles de inventario.
 * Vive en la capa de aplicación porque trabaja con Read Models (DTOs),
 * no con agregados de dominio.
 *
 * La implementación (TypeOrmInventoryLevelQueryService) vive en infraestructura
 * y puede hacer JOINs directos para obtener ingredientName, unitName, categoryName, etc.
 */
export abstract class InventoryLevelQueryService {
  abstract search(criteria: Criteria): Promise<InventoryLevelSearchResult>
}
