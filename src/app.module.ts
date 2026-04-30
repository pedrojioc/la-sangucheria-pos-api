import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Configuration
import { EnvConfigModule } from './config/env/env.config'
import { DatabaseModule } from './config/database/database.module'
import appConfig from './config/app.config'

// Shared Infrastructure
import { SharedInfrastructureModule } from '@shared/infrastructure/shared-infrastructure.module'

// Feature Modules
import { IngredientCategoryModule } from '@contexts/inventory/ingredient-category/ingredient-category.module'
import { IngredientModule } from '@contexts/inventory/ingredient/ingredient.module'
import { InventoryBatchModule } from '@contexts/inventory/batch/inventory-batch.module'
import { StockLevelModule } from '@contexts/inventory/stock-level/stock-level.module'
import { UnitModule } from '@contexts/shared-kernel/unit/unit.module'
import { ProductCategoryModule } from '@contexts/menu/product-category/product-category.module'
import { ProductModule } from '@contexts/menu/product/product.module'
import { PurchaseOrderModule } from '@contexts/procurement/purchase-order/purchase-order.module'
import { SupplierModule } from '@contexts/procurement/supplier/supplier.module'
import { TransformationModule } from './contexts/kitchen/transformation/transformation.module'
import { RecipeModule } from '@contexts/kitchen/recipe/recipe.module'

// IAM Modules
import { RoleModule } from '@contexts/iam/role/role.module'
import { UserModule } from '@contexts/iam/user/user.module'
import { AuthenticationModule } from '@contexts/iam/authentication/authentication.module'

// HR Modules
import { PositionModule } from '@contexts/hr/position/position.module'
import { EmployeeModule } from '@contexts/hr/employee/employee.module'

@Module({
  imports: [
    // =====================================
    // CONFIGURATION
    // =====================================
    EnvConfigModule,
    ConfigModule.forFeature(appConfig),

    // =====================================
    // DATABASE
    // =====================================
    DatabaseModule,

    // =====================================
    // SHARED INFRASTRUCTURE (Global)
    // =====================================
    SharedInfrastructureModule,

    // =====================================
    // IAM (Identity & Access Management)
    // =====================================
    RoleModule,
    UserModule,
    AuthenticationModule,

    // =====================================
    // HR (Human Resources)
    // =====================================
    PositionModule,
    EmployeeModule,

    // =====================================
    // FEATURE MODULES
    // =====================================
    UnitModule,
    IngredientCategoryModule,
    IngredientModule,
    InventoryBatchModule,
    StockLevelModule,
    ProductCategoryModule,
    ProductModule,
    PurchaseOrderModule,
    SupplierModule,
    TransformationModule,
    RecipeModule
  ],

  providers: [],
  exports: []
})
export class AppModule {}
