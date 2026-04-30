import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { SearchInventoryLevelsRequest } from '../dto/search-inventory-levels.request'
import { RegisterManualAdjustmentRequest } from '../dto/register-manual-adjustment.request'
import { SearchInventoryLevelsByCriteriaQuery } from '../../../application/search-by-criteria/search-inventory-levels-by-criteria.query'
import { GetInventoryLevelStatisticsQuery } from '../../../application/get-statistics/get-inventory-level-statistics.query'
import { RegisterManualAdjustmentCommand } from '../../../application/register-manual-adjustment/register-manual-adjustment.command'
import { PaginatedInventoryLevelListResponse } from '../../../application/dto/paginated-inventory-level-list.response'
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
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus
  ) {}

  @Get('summary')
  async getSummary(): Promise<InventoryLevelStatistics> {
    return this.queryBus.execute(new GetInventoryLevelStatisticsQuery())
  }

  @Get()
  async search(
    @Query() dto: SearchInventoryLevelsRequest
  ): Promise<PaginatedInventoryLevelListResponse> {
    const criteria = dto.toCriteria()
    return this.queryBus.execute(new SearchInventoryLevelsByCriteriaQuery(criteria))
  }

  @Post(':ingredientId/adjustments')
  @HttpCode(HttpStatus.CREATED)
  async registerAdjustment(
    @Param('ingredientId') ingredientId: string,
    @Body() dto: RegisterManualAdjustmentRequest
  ): Promise<{ id: string }> {
    const command = new RegisterManualAdjustmentCommand(
      ingredientId,
      dto.type,
      dto.quantity,
      dto.note ?? null,
      null // performedBy: se integrará cuando haya autenticación
    )
    return this.commandBus.execute(command)
  }
}
