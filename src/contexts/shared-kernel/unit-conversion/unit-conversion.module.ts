import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { UnitConversionEntity } from './infrastructure/persistence/typeorm/unit-conversion.entity'

// Repositories
import { UnitConversionRepository } from './domain/repositories/unit-conversion.repository'
import { TypeOrmUnitConversionRepository } from './infrastructure/persistence/typeorm/typeorm-unit-conversion.repository'

// Domain Services
import { UnitConversionService } from './domain/services/unit-conversion.service'

// Use Cases
import { ConvertQuantity } from './application/convert-quantity/convert-quantity'
import { GetConversionFactor } from './application/get-conversion-factor/get-conversion-factor'

// Factory helper
import { createProvider } from '@/core/utils/create-provider'

/**
 * UnitConversionsModule
 *
 * IMPORTANTE: Marcado como @Global() para que UnitConversionService
 * esté disponible en todos los módulos sin necesidad de importarlo.
 *
 * Esto es necesario porque las conversiones se usan en:
 * - Inventory (para FIFO con diferentes unidades)
 * - Transformations (para escalar recetas)
 * - Products (para verificar stock en recetas)
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UnitConversionEntity])],
  providers: [
    // Repositories
    {
      provide: UnitConversionRepository,
      useClass: TypeOrmUnitConversionRepository
    },

    // Domain Services (exportado globalmente)
    UnitConversionService,

    // Use Cases
    createProvider(ConvertQuantity, [UnitConversionRepository, UnitConversionService]),
    createProvider(GetConversionFactor, [UnitConversionRepository])
  ],
  exports: [
    // Exportar para uso en otros módulos
    UnitConversionRepository,
    UnitConversionService,
    ConvertQuantity,
    GetConversionFactor
  ]
})
export class UnitConversionsModule {}
