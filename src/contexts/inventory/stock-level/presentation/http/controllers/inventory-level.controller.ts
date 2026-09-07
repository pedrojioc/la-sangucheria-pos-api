import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { SearchInventoryLevelsRequest } from '../dto/search-inventory-levels.request'
import { RegisterManualAdjustmentRequest } from '../dto/register-manual-adjustment.request'
import { SearchInventoryLevelsByCriteria } from '../../../application/search-by-criteria/search-inventory-levels-by-criteria'
import { GetInventoryLevelStatistics } from '../../../application/get-statistics/get-inventory-level-statistics'
import { RegisterManualAdjustment } from '../../../application/register-manual-adjustment/register-manual-adjustment'
import { PaginatedInventoryLevelListResponse } from '../../../application/dto/paginated-inventory-level-list.response'
import { InventoryLevelListItemResponse } from '../../../application/dto/inventory-level-list-item.response'
import { InventoryLevelStatistics } from '../../../application/dto/inventory-level-statistics'

/**
 * InventoryLevelController - Presentation Layer
 *
 * Endpoints:
 * - GET  /inventory-levels              — Listado paginado con filtros y ordenamiento
 * - GET  /inventory-levels/summary      — Conteos de alertas (lowStock, criticalStock, outOfStock)
 * - POST /inventory-levels/:ingredientId/adjustments — Ajuste manual de stock
 *
 * Ejemplos de ajuste:
 * - POST /inventory-levels/abc-123/adjustments  { type: "ENTRY", quantity: 10, unitId: "...", note: "Corrección" }
 * - POST /inventory-levels/abc-123/adjustments  { type: "WASTE", quantity: 2, unitId: "...", note: "Vencimiento" }
 * - POST /inventory-levels/abc-123/adjustments  { type: "ADJUSTMENT", quantity: 5, unitId: "...", note: "Conteo físico" }
 */
@Controller('inventory-levels')
export class InventoryLevelController {
  constructor(
    private readonly searchInventoryLevelsByCriteria: SearchInventoryLevelsByCriteria,
    private readonly getInventoryLevelStatistics: GetInventoryLevelStatistics,
    private readonly registerManualAdjustment: RegisterManualAdjustment
  ) {}

  @Get('summary')
  async getSummary(): Promise<InventoryLevelStatistics> {
    return this.getInventoryLevelStatistics.run()
  }

  @Get()
  async search(
    @Query() dto: SearchInventoryLevelsRequest
  ): Promise<PaginatedInventoryLevelListResponse> {
    const result = await this.searchInventoryLevelsByCriteria.run(dto.toCriteria())
    const data = result.paginated.data.map(item =>
      InventoryLevelListItemResponse.fromReadModel(item)
    )
    return new PaginatedInventoryLevelListResponse(data, result.paginated.meta, result.stats)
  }

  @Post(':ingredientId/adjustments')
  @HttpCode(HttpStatus.CREATED)
  async registerAdjustment(
    @Param('ingredientId') ingredientId: string,
    @Body() dto: RegisterManualAdjustmentRequest
  ): Promise<{ id: string }> {
    const id = await this.registerManualAdjustment.run(
      ingredientId,
      dto.type,
      dto.quantity,
      dto.note ?? null,
      null // performedBy: se integrará cuando haya autenticación
    )
    return { id }
  }
}
