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
import { ProductOptionModule } from '@contexts/menu/product-option/product-option.module'
import { ProductRecipeModule } from '@contexts/menu/product-recipe/product-recipe.module'

// IAM Modules
import { RoleModule } from '@contexts/iam/role/role.module'
import { UserModule } from '@contexts/iam/user/user.module'
import { AuthenticationModule } from '@contexts/iam/authentication/authentication.module'

// HR Modules
import { PositionModule } from '@contexts/hr/position/position.module'
import { EmployeeModule } from '@contexts/hr/employee/employee.module'

// CRM Modules
import { CustomerModule } from '@contexts/crm/customer/customer.module'
import { AddressModule } from '@contexts/crm/address/address.module'
import { LoyaltyModule } from '@contexts/crm/loyalty/loyalty.module'

// Restaurant Modules
import { TableModule } from '@contexts/restaurant/table/table.module'
import { ZoneModule } from '@contexts/restaurant/zone/zone.module'
import { FloorElementModule } from '@contexts/restaurant/floor-element/floor-element.module'

// Kitchen Operations Modules
import { StationModule } from '@contexts/kitchen-operations/station/station.module'
import { KitchenBoardModule } from '@contexts/kitchen-operations/kitchen-board/kitchen-board.module'
import { KitchenPrinterModule } from '@contexts/kitchen-operations/kitchen-printer/kitchen-printer.module'

// Orders Modules
import { OrderModule } from '@contexts/orders/order/order.module'

// Establishment Modules
import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'

// Billing Modules
import { BillingModule } from '@contexts/billing/billing.module'

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
    // CRM (Customer Relationship)
    // =====================================
    CustomerModule,
    AddressModule,
    LoyaltyModule,
    TableModule,
    ZoneModule,
    FloorElementModule,

    // =====================================
    // KITCHEN OPERATIONS
    // =====================================
    StationModule,
    KitchenBoardModule,
    KitchenPrinterModule,

    // =====================================
    // ORDERS
    // =====================================
    OrderModule,

    // =====================================
    // ESTABLISHMENT
    // =====================================
    EstablishmentModule,

    // =====================================
    // BILLING
    // =====================================
    BillingModule,

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
    ProductOptionModule,
    ProductRecipeModule,
    PurchaseOrderModule,
    SupplierModule,
    TransformationModule,
    RecipeModule
  ],

  providers: [],
  exports: []
})
export class AppModule {}
