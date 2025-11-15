Diseño del Módulo de Inventario - La Sanguchería

Estructura de Carpetas - La Sanguchería POS
la-sangucheria-pos/
│
├── src/
│ │
│ ├── modules/ # Módulos de negocio
│ │ │
│ │ ├── categories/ # Módulo de Categorías
│ │ │ ├── domain/
│ │ │ │ ├── aggregates/
│ │ │ │ │ └── Category/
│ │ │ │ │ └── Category.ts
│ │ │ │ │
│ │ │ │ ├── repositories/
│ │ │ │ │ └── ICategoryRepository.ts
│ │ │ │ │
│ │ │ │ ├── events/
│ │ │ │ │ ├── CategoryCreatedEvent.ts
│ │ │ │ │ ├── CategoryUpdatedEvent.ts
│ │ │ │ │ └── CategoryDeletedEvent.ts
│ │ │ │ │
│ │ │ │ └── exceptions/
│ │ │ │ ├── CategoryNotFoundException.ts
│ │ │ │ └── DuplicateCategoryNameException.ts
│ │ │ │
│ │ │ ├── application/
│ │ │ │ ├── use-cases/
│ │ │ │ │ ├── create-category/
│ │ │ │ │ │ ├── CreateCategoryUseCase.ts
│ │ │ │ │ │ ├── CreateCategoryCommand.ts
│ │ │ │ │ │ └── CreateCategoryResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── update-category/
│ │ │ │ │ │ ├── UpdateCategoryUseCase.ts
│ │ │ │ │ │ ├── UpdateCategoryCommand.ts
│ │ │ │ │ │ └── UpdateCategoryResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── delete-category/
│ │ │ │ │ │ ├── DeleteCategoryUseCase.ts
│ │ │ │ │ │ └── DeleteCategoryCommand.ts
│ │ │ │ │ │
│ │ │ │ │ ├── list-categories/
│ │ │ │ │ │ ├── ListCategoriesUseCase.ts
│ │ │ │ │ │ ├── ListCategoriesQuery.ts
│ │ │ │ │ │ └── ListCategoriesResult.ts
│ │ │ │ │ │
│ │ │ │ │ └── get-category/
│ │ │ │ │ ├── GetCategoryUseCase.ts
│ │ │ │ │ ├── GetCategoryQuery.ts
│ │ │ │ │ └── GetCategoryResult.ts
│ │ │ │ │
│ │ │ │ └── dto/
│ │ │ │ └── CategoryDto.ts
│ │ │ │
│ │ │ ├── infrastructure/
│ │ │ │ └── persistence/
│ │ │ │ ├── typeorm/
│ │ │ │ │ ├── entities/
│ │ │ │ │ │ └── CategoryEntity.ts
│ │ │ │ │ ├── repositories/
│ │ │ │ │ │ └── TypeOrmCategoryRepository.ts
│ │ │ │ │ └── mappers/
│ │ │ │ │ └── CategoryMapper.ts
│ │ │ │ │
│ │ │ │ └── migrations/
│ │ │ │ └── 001_create_categories_table.ts
│ │ │ │
│ │ │ └── presentation/
│ │ │ └── http/
│ │ │ ├── controllers/
│ │ │ │ └── CategoryController.ts
│ │ │ ├── dto/
│ │ │ │ ├── CreateCategoryDto.ts
│ │ │ │ └── UpdateCategoryDto.ts
│ │ │ ├── validators/
│ │ │ │ ├── CreateCategoryValidator.ts
│ │ │ │ └── UpdateCategoryValidator.ts
│ │ │ └── routes/
│ │ │ └── category.routes.ts
│ │ │
│ │ ├── ingredients/ # Módulo de Ingredientes
│ │ │ ├── domain/
│ │ │ │ ├── aggregates/
│ │ │ │ │ └── Ingredient/
│ │ │ │ │ ├── Ingredient.ts
│ │ │ │ │ ├── IngredientCategory.ts (VO)
│ │ │ │ │ └── MeasurementUnit.ts (VO)
│ │ │ │ │
│ │ │ │ ├── repositories/
│ │ │ │ │ └── IIngredientRepository.ts
│ │ │ │ │
│ │ │ │ ├── events/
│ │ │ │ │ ├── IngredientCreatedEvent.ts
│ │ │ │ │ ├── IngredientUpdatedEvent.ts
│ │ │ │ │ └── IngredientDeactivatedEvent.ts
│ │ │ │ │
│ │ │ │ └── exceptions/
│ │ │ │ ├── IngredientNotFoundException.ts
│ │ │ │ └── DuplicateIngredientNameException.ts
│ │ │ │
│ │ │ ├── application/
│ │ │ │ ├── use-cases/
│ │ │ │ │ ├── create-ingredient/
│ │ │ │ │ │ ├── CreateIngredientUseCase.ts
│ │ │ │ │ │ ├── CreateIngredientCommand.ts
│ │ │ │ │ │ └── CreateIngredientResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── update-ingredient/
│ │ │ │ │ │ ├── UpdateIngredientUseCase.ts
│ │ │ │ │ │ ├── UpdateIngredientCommand.ts
│ │ │ │ │ │ └── UpdateIngredientResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── deactivate-ingredient/
│ │ │ │ │ │ ├── DeactivateIngredientUseCase.ts
│ │ │ │ │ │ └── DeactivateIngredientCommand.ts
│ │ │ │ │ │
│ │ │ │ │ ├── list-ingredients/
│ │ │ │ │ │ ├── ListIngredientsUseCase.ts
│ │ │ │ │ │ ├── ListIngredientsQuery.ts
│ │ │ │ │ │ └── ListIngredientsResult.ts
│ │ │ │ │ │
│ │ │ │ │ └── get-ingredient/
│ │ │ │ │ ├── GetIngredientUseCase.ts
│ │ │ │ │ ├── GetIngredientQuery.ts
│ │ │ │ │ └── GetIngredientResult.ts
│ │ │ │ │
│ │ │ │ ├── services/
│ │ │ │ │ └── IngredientQueryService.ts
│ │ │ │ │
│ │ │ │ └── dto/
│ │ │ │ └── IngredientDto.ts
│ │ │ │
│ │ │ ├── infrastructure/
│ │ │ │ └── persistence/
│ │ │ │ └── typeorm/
│ │ │ │ ├── entities/
│ │ │ │ │ └── IngredientEntity.ts
│ │ │ │ ├── repositories/
│ │ │ │ │ └── TypeOrmIngredientRepository.ts
│ │ │ │ └── mappers/
│ │ │ │ └── IngredientMapper.ts
│ │ │ │
│ │ │ └── presentation/
│ │ │ └── http/
│ │ │ ├── controllers/
│ │ │ │ └── IngredientController.ts
│ │ │ ├── dto/
│ │ │ │ ├── CreateIngredientDto.ts
│ │ │ │ └── UpdateIngredientDto.ts
│ │ │ ├── validators/
│ │ │ │ └── CreateIngredientValidator.ts
│ │ │ └── routes/
│ │ │ └── ingredient.routes.ts
│ │ │
│ │ ├── inventory/ # Módulo de Inventario
│ │ │ ├── domain/
│ │ │ │ ├── aggregates/
│ │ │ │ │ ├── InventoryItem/
│ │ │ │ │ │ ├── InventoryItem.ts
│ │ │ │ │ │ ├── PurchaseBatch.ts (Entity)
│ │ │ │ │ │ ├── ValuationMethod.ts (VO)
│ │ │ │ │ │ └── Money.ts (VO)
│ │ │ │ │ │
│ │ │ │ │ ├── StockMovement/
│ │ │ │ │ │ ├── StockMovement.ts
│ │ │ │ │ │ ├── MovementType.ts (VO)
│ │ │ │ │ │ └── MovementDirection.ts (VO)
│ │ │ │ │ │
│ │ │ │ │ └── PurchaseOrder/
│ │ │ │ │ ├── PurchaseOrder.ts
│ │ │ │ │ ├── PurchaseOrderItem.ts (Entity)
│ │ │ │ │ └── PurchaseOrderStatus.ts (VO)
│ │ │ │ │
│ │ │ │ ├── repositories/
│ │ │ │ │ ├── IInventoryItemRepository.ts
│ │ │ │ │ ├── IStockMovementRepository.ts
│ │ │ │ │ └── IPurchaseOrderRepository.ts
│ │ │ │ │
│ │ │ │ ├── services/
│ │ │ │ │ ├── InventoryValuationService.ts
│ │ │ │ │ ├── StockAvailabilityService.ts
│ │ │ │ │ └── StockDeductionService.ts
│ │ │ │ │
│ │ │ │ ├── events/
│ │ │ │ │ ├── IngredientPurchasedEvent.ts
│ │ │ │ │ ├── IngredientConsumedEvent.ts
│ │ │ │ │ ├── LowStockAlertEvent.ts
│ │ │ │ │ ├── StockAdjustedEvent.ts
│ │ │ │ │ ├── BatchExpiringSoonEvent.ts
│ │ │ │ │ ├── PurchaseOrderCreatedEvent.ts
│ │ │ │ │ ├── PurchaseOrderReceivedEvent.ts
│ │ │ │ │ └── PurchaseOrderCancelledEvent.ts
│ │ │ │ │
│ │ │ │ └── exceptions/
│ │ │ │ ├── InsufficientStockException.ts
│ │ │ │ ├── NegativeStockException.ts
│ │ │ │ ├── BatchNotFoundException.ts
│ │ │ │ └── PurchaseOrderNotFoundException.ts
│ │ │ │
│ │ │ ├── application/
│ │ │ │ ├── use-cases/
│ │ │ │ │ ├── purchase-orders/
│ │ │ │ │ │ ├── create-purchase-order/
│ │ │ │ │ │ │ ├── CreatePurchaseOrderUseCase.ts
│ │ │ │ │ │ │ ├── CreatePurchaseOrderCommand.ts
│ │ │ │ │ │ │ └── CreatePurchaseOrderResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── add-item-to-purchase-order/
│ │ │ │ │ │ │ ├── AddItemToPurchaseOrderUseCase.ts
│ │ │ │ │ │ │ └── AddItemToPurchaseOrderCommand.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── submit-purchase-order/
│ │ │ │ │ │ │ ├── SubmitPurchaseOrderUseCase.ts
│ │ │ │ │ │ │ └── SubmitPurchaseOrderCommand.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── confirm-purchase-order/
│ │ │ │ │ │ │ ├── ConfirmPurchaseOrderUseCase.ts
│ │ │ │ │ │ │ └── ConfirmPurchaseOrderCommand.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── receive-purchase-order/
│ │ │ │ │ │ │ ├── ReceivePurchaseOrderUseCase.ts
│ │ │ │ │ │ │ ├── ReceivePurchaseOrderCommand.ts
│ │ │ │ │ │ │ └── ReceivePurchaseOrderResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── cancel-purchase-order/
│ │ │ │ │ │ │ ├── CancelPurchaseOrderUseCase.ts
│ │ │ │ │ │ │ └── CancelPurchaseOrderCommand.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ └── list-purchase-orders/
│ │ │ │ │ │ ├── ListPurchaseOrdersUseCase.ts
│ │ │ │ │ │ ├── ListPurchaseOrdersQuery.ts
│ │ │ │ │ │ └── ListPurchaseOrdersResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── inventory-management/
│ │ │ │ │ │ ├── adjust-stock/
│ │ │ │ │ │ │ ├── AdjustStockUseCase.ts
│ │ │ │ │ │ │ ├── AdjustStockCommand.ts
│ │ │ │ │ │ │ └── AdjustStockResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── register-waste/
│ │ │ │ │ │ │ ├── RegisterWasteUseCase.ts
│ │ │ │ │ │ │ ├── RegisterWasteCommand.ts
│ │ │ │ │ │ │ └── RegisterWasteResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── consume-ingredients/
│ │ │ │ │ │ │ ├── ConsumeIngredientsUseCase.ts
│ │ │ │ │ │ │ ├── ConsumeIngredientsCommand.ts
│ │ │ │ │ │ │ └── ConsumeIngredientsResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ └── check-availability/
│ │ │ │ │ │ ├── CheckIngredientAvailabilityUseCase.ts
│ │ │ │ │ │ ├── CheckIngredientAvailabilityQuery.ts
│ │ │ │ │ │ └── CheckIngredientAvailabilityResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── queries/
│ │ │ │ │ │ ├── get-inventory-item/
│ │ │ │ │ │ │ ├── GetInventoryItemUseCase.ts
│ │ │ │ │ │ │ ├── GetInventoryItemQuery.ts
│ │ │ │ │ │ │ └── GetInventoryItemResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── list-low-stock/
│ │ │ │ │ │ │ ├── ListLowStockIngredientsUseCase.ts
│ │ │ │ │ │ │ ├── ListLowStockIngredientsQuery.ts
│ │ │ │ │ │ │ └── ListLowStockIngredientsResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── list-expiring-soon/
│ │ │ │ │ │ │ ├── ListExpiringSoonBatchesUseCase.ts
│ │ │ │ │ │ │ ├── ListExpiringSoonBatchesQuery.ts
│ │ │ │ │ │ │ └── ListExpiringSoonBatchesResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ ├── get-stock-movements/
│ │ │ │ │ │ │ ├── GetStockMovementsUseCase.ts
│ │ │ │ │ │ │ ├── GetStockMovementsQuery.ts
│ │ │ │ │ │ │ └── GetStockMovementsResult.ts
│ │ │ │ │ │ │
│ │ │ │ │ │ └── calculate-inventory-value/
│ │ │ │ │ │ ├── CalculateInventoryValueUseCase.ts
│ │ │ │ │ │ ├── CalculateInventoryValueQuery.ts
│ │ │ │ │ │ └── CalculateInventoryValueResult.ts
│ │ │ │ │ │
│ │ │ │ │ └── reports/
│ │ │ │ │ ├── generate-stock-report/
│ │ │ │ │ │ ├── GenerateStockReportUseCase.ts
│ │ │ │ │ │ ├── GenerateStockReportQuery.ts
│ │ │ │ │ │ └── GenerateStockReportResult.ts
│ │ │ │ │ │
│ │ │ │ │ └── generate-consumption-report/
│ │ │ │ │ ├── GenerateConsumptionReportUseCase.ts
│ │ │ │ │ ├── GenerateConsumptionReportQuery.ts
│ │ │ │ │ └── GenerateConsumptionReportResult.ts
│ │ │ │ │
│ │ │ │ ├── services/
│ │ │ │ │ └── InventoryQueryService.ts
│ │ │ │ │
│ │ │ │ └── dto/
│ │ │ │ ├── InventoryItemDto.ts
│ │ │ │ ├── PurchaseBatchDto.ts
│ │ │ │ ├── StockMovementDto.ts
│ │ │ │ └── PurchaseOrderDto.ts
│ │ │ │
│ │ │ ├── infrastructure/
│ │ │ │ └── persistence/
│ │ │ │ └── typeorm/
│ │ │ │ ├── entities/
│ │ │ │ │ ├── InventoryItemEntity.ts
│ │ │ │ │ ├── PurchaseBatchEntity.ts
│ │ │ │ │ ├── StockMovementEntity.ts
│ │ │ │ │ ├── PurchaseOrderEntity.ts
│ │ │ │ │ └── PurchaseOrderItemEntity.ts
│ │ │ │ │
│ │ │ │ ├── repositories/
│ │ │ │ │ ├── TypeOrmInventoryItemRepository.ts
│ │ │ │ │ ├── TypeOrmStockMovementRepository.ts
│ │ │ │ │ └── TypeOrmPurchaseOrderRepository.ts
│ │ │ │ │
│ │ │ │ └── mappers/
│ │ │ │ ├── InventoryItemMapper.ts
│ │ │ │ ├── StockMovementMapper.ts
│ │ │ │ └── PurchaseOrderMapper.ts
│ │ │ │
│ │ │ └── presentation/
│ │ │ └── http/
│ │ │ ├── controllers/
│ │ │ │ ├── InventoryController.ts
│ │ │ │ ├── PurchaseOrderController.ts
│ │ │ │ └── StockMovementController.ts
│ │ │ │
│ │ │ ├── dto/
│ │ │ │ ├── CreatePurchaseOrderDto.ts
│ │ │ │ ├── ReceivePurchaseOrderDto.ts
│ │ │ │ ├── AdjustStockDto.ts
│ │ │ │ └── RegisterWasteDto.ts
│ │ │ │
│ │ │ ├── validators/
│ │ │ │ ├── CreatePurchaseOrderValidator.ts
│ │ │ │ └── AdjustStockValidator.ts
│ │ │ │
│ │ │ └── routes/
│ │ │ ├── inventory.routes.ts
│ │ │ ├── purchase-order.routes.ts
│ │ │ └── stock-movement.routes.ts
│ │ │
│ │ ├── products/ # Módulo de Productos
│ │ │ ├── domain/
│ │ │ │ ├── aggregates/
│ │ │ │ │ └── Product/
│ │ │ │ │ ├── Product.ts
│ │ │ │ │ ├── Recipe.ts (Entity)
│ │ │ │ │ ├── RecipeIngredient.ts (Entity)
│ │ │ │ │ ├── ProductType.ts (VO)
│ │ │ │ │ ├── ProductStatus.ts (VO)
│ │ │ │ │ ├── ProductPrice.ts (VO)
│ │ │ │ │ └── ProductSKU.ts (VO)
│ │ │ │ │
│ │ │ │ ├── repositories/
│ │ │ │ │ └── IProductRepository.ts
│ │ │ │ │
│ │ │ │ ├── services/
│ │ │ │ │ ├── ProductAvailabilityService.ts
│ │ │ │ │ └── ProductCostCalculationService.ts
│ │ │ │ │
│ │ │ │ ├── events/
│ │ │ │ │ ├── ProductCreatedEvent.ts
│ │ │ │ │ ├── ProductUpdatedEvent.ts
│ │ │ │ │ ├── ProductRecipeSetEvent.ts
│ │ │ │ │ ├── ProductRecipeUpdatedEvent.ts
│ │ │ │ │ ├── ProductStatusChangedEvent.ts
│ │ │ │ │ └── ProductDeactivatedEvent.ts
│ │ │ │ │
│ │ │ │ └── exceptions/
│ │ │ │ ├── ProductNotFoundException.ts
│ │ │ │ ├── DuplicateSkuException.ts
│ │ │ │ ├── InvalidProductTypeException.ts
│ │ │ │ └── ProductCannotBeModifiedException.ts
│ │ │ │
│ │ │ ├── application/
│ │ │ │ ├── use-cases/
│ │ │ │ │ ├── create-product/
│ │ │ │ │ │ ├── CreateProductUseCase.ts
│ │ │ │ │ │ ├── CreateProductCommand.ts
│ │ │ │ │ │ └── CreateProductResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── update-product/
│ │ │ │ │ │ ├── UpdateProductUseCase.ts
│ │ │ │ │ │ ├── UpdateProductCommand.ts
│ │ │ │ │ │ └── UpdateProductResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── set-product-recipe/
│ │ │ │ │ │ ├── SetProductRecipeUseCase.ts
│ │ │ │ │ │ ├── SetProductRecipeCommand.ts
│ │ │ │ │ │ └── SetProductRecipeResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── update-product-recipe/
│ │ │ │ │ │ ├── UpdateProductRecipeUseCase.ts
│ │ │ │ │ │ ├── UpdateProductRecipeCommand.ts
│ │ │ │ │ │ └── UpdateProductRecipeResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── change-product-status/
│ │ │ │ │ │ ├── ChangeProductStatusUseCase.ts
│ │ │ │ │ │ ├── ChangeProductStatusCommand.ts
│ │ │ │ │ │ └── ChangeProductStatusResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── deactivate-product/
│ │ │ │ │ │ ├── DeactivateProductUseCase.ts
│ │ │ │ │ │ └── DeactivateProductCommand.ts
│ │ │ │ │ │
│ │ │ │ │ ├── check-product-availability/
│ │ │ │ │ │ ├── CheckProductAvailabilityUseCase.ts
│ │ │ │ │ │ ├── CheckProductAvailabilityQuery.ts
│ │ │ │ │ │ └── CheckProductAvailabilityResult.ts
│ │ │ │ │ │
│ │ │ │ │ ├── list-products/
│ │ │ │ │ │ ├── ListProductsUseCase.ts
│ │ │ │ │ │ ├── ListProductsQuery.ts
│ │ │ │ │ │ └── ListProductsResult.ts
│ │ │ │ │ │
│ │ │ │ │ └── get-product-details/
│ │ │ │ │ ├── GetProductDetailsUseCase.ts
│ │ │ │ │ ├── GetProductDetailsQuery.ts
│ │ │ │ │ └── GetProductDetailsResult.ts
│ │ │ │ │
│ │ │ │ ├── services/
│ │ │ │ │ └── ProductQueryService.ts
│ │ │ │ │
│ │ │ │ └── dto/
│ │ │ │ ├── ProductDto.ts
│ │ │ │ ├── RecipeDto.ts
│ │ │ │ └── RecipeIngredientDto.ts
│ │ │ │
│ │ │ ├── infrastructure/
│ │ │ │ └── persistence/
│ │ │ │ └── typeorm/
│ │ │ │ ├── entities/
│ │ │ │ │ ├── ProductEntity.ts
│ │ │ │ │ ├── RecipeEntity.ts
│ │ │ │ │ └── RecipeIngredientEntity.ts
│ │ │ │ │
│ │ │ │ ├── repositories/
│ │ │ │ │ └── TypeOrmProductRepository.ts
│ │ │ │ │
│ │ │ │ └── mappers/
│ │ │ │ ├── ProductMapper.ts
│ │ │ │ └── RecipeMapper.ts
│ │ │ │
│ │ │ └── presentation/
│ │ │ └── http/
│ │ │ ├── controllers/
│ │ │ │ └── ProductController.ts
│ │ │ │
│ │ │ ├── dto/
│ │ │ │ ├── CreateProductDto.ts
│ │ │ │ ├── UpdateProductDto.ts
│ │ │ │ ├── SetRecipeDto.ts
│ │ │ │ └── UpdateRecipeDto.ts
│
│ │ │ │
│ │ │ ├── validators/
│ │ │ │ ├── CreateProductValidator.ts
│ │ │ │ ├── UpdateProductValidator.ts
│ │ │ │ └── SetRecipeValidator.ts
│ │ │ │
│ │ │ └── routes/
│ │ │ └── product.routes.ts
│ │ │
│ │ ├── orders/ # Módulo de Órdenes (futuro)
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── presentation/
│ │ │
│ │ ├── tables/ # Módulo de Mesas (futuro)
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── presentation/
│ │ │
│ │ ├── payments/ # Módulo de Pagos (futuro)
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── presentation/
│ │ │
│ │ ├── delivery/ # Módulo de Delivery (futuro)
│ │ │ ├── domain/
│ │ │ ├── application/
│ │ │ ├── infrastructure/
│ │ │ └── presentation/
│ │ │
│ │ └── staff/ # Módulo de Personal (futuro)
│ │ ├── domain/
│ │ ├── application/
│ │ ├── infrastructure/
│ │ └── presentation/
│ │
│ ├── shared/ # Código compartido entre módulos
│ │ ├── domain/
│ │ │ ├── base/
│ │ │ │ ├── AggregateRoot.ts
│ │ │ │ ├── Entity.ts
│ │ │ │ └── ValueObject.ts
│ │ │ │
│ │ │ ├── value-objects/
│ │ │ │ ├── Money.ts
│ │ │ │ ├── Email.ts
│ │ │ │ ├── PhoneNumber.ts
│ │ │ │ ├── Address.ts
│ │ │ │ └── DateRange.ts
│ │ │ │
│ │ │ ├── events/
│ │ │ │ ├── DomainEvent.ts
│ │ │ │ ├── IDomainEventHandler.ts
│ │ │ │ └── IEventPublisher.ts
│ │ │ │
│ │ │ ├── repositories/
│ │ │ │ └── IRepository.ts
│ │ │ │
│ │ │ └── exceptions/
│ │ │ ├── DomainException.ts
│ │ │ ├── NotFoundException.ts
│ │ │ ├── ValidationException.ts
│ │ │ └── BusinessRuleViolationException.ts
│ │ │
│ │ ├── application/
│ │ │ ├── interfaces/
│ │ │ │ ├── IUseCase.ts
│ │ │ │ ├── IQuery.ts
│ │ │ │ ├── ICommand.ts
│ │ │ │ └── IUnitOfWork.ts
│ │ │ │
│ │ │ ├── behaviors/
│ │ │ │ ├── LoggingBehavior.ts
│ │ │ │ ├── ValidationBehavior.ts
│ │ │ │ └── TransactionBehavior.ts
│ │ │ │
│ │ │ └── dto/
│ │ │ ├── PaginationDto.ts
│ │ │ ├── FilterDto.ts
│ │ │ └── SortDto.ts
│ │ │
│ │ └── infrastructure/
│ │ ├── database/
│ │ │ ├── typeorm/
│ │ │ │ ├── config/
│ │ │ │ │ └── typeorm.config.ts
│ │ │ │ ├── base/
│ │ │ │ │ └── BaseTypeOrmRepository.ts
│ │ │ │ └── migrations/
│ │ │ │ └── .gitkeep
│ │ │ │
│ │ │ └── seeders/
│ │ │ └── .gitkeep
│ │ │
│ │ ├── messaging/
│ │ │ ├── EventBus.ts
│ │ │ └── InMemoryEventBus.ts
│ │ │
│ │ ├── logging/
│ │ │ ├── ILogger.ts
│ │ │ └── WinstonLogger.ts
│ │ │
│ │ └── caching/
│ │ ├── ICache.ts
│ │ └── InMemoryCache.ts
│ │
│ ├── config/ # Configuración de la aplicación
│ │ ├── env/
│ │ │ ├── development.env
│ │ │ ├── production.env
│ │ │ └── test.env
│ │ │
│ │ ├── database.config.ts
│ │ ├── app.config.ts
│ │ ├── logger.config.ts
│ │ └── validation.config.ts
│ │
│ ├── core/ # NestJS core (sin lógica de negocio)
│ │ ├── modules/
│ │ │ ├── CategoryModule.ts
│ │ │ ├── IngredientModule.ts
│ │ │ ├── InventoryModule.ts
│ │ │ ├── ProductModule.ts
│ │ │ └── AppModule.ts
│ │ │
│ │ ├── filters/
│ │ │ ├── HttpExceptionFilter.ts
│ │ │ ├── DomainExceptionFilter.ts
│ │ │ └── ValidationExceptionFilter.ts
│ │ │
│ │ ├── interceptors/
│ │ │ ├── LoggingInterceptor.ts
│ │ │ ├── TransformInterceptor.ts
│ │ │ └── TimeoutInterceptor.ts
│ │ │
│ │ ├── guards/
│ │ │ ├── AuthGuard.ts
│ │ │ └── RolesGuard.ts
│ │ │
│ │ ├── decorators/
│ │ │ ├── Roles.decorator.ts
│ │ │ ├── User.decorator.ts
│ │ │ └── ApiPaginatedResponse.decorator.ts
│ │ │
│ │ └── pipes/
│ │ ├── ValidationPipe.ts
│ │ └── ParseUuidPipe.ts
│ │
│ ├── common/ # Utilidades comunes
│ │ ├── utils/
│ │ │ ├── uuid.util.ts
│ │ │ ├── date.util.ts
│ │ │ └── string.util.ts
│ │ │
│ │ ├── constants/
│ │ │ ├── app.constants.ts
│ │ │ ├── error-messages.constants.ts
│ │ │ └── validation.constants.ts
│ │ │
│ │ └── types/
│ │ ├── response.type.ts
│ │ └── pagination.type.ts
│ │
│ └── main.ts # Punto de entrada de NestJS
│
├── test/ # Tests
│ ├── unit/
│ │ ├── categories/
│ │ │ └── domain/
│ │ │ └── Category.spec.ts
│ │ │
│ │ ├── ingredients/
│ │ │ └── domain/
│ │ │ └── Ingredient.spec.ts
│ │ │
│ │ ├── inventory/
│ │ │ └── domain/
│ │ │ ├── InventoryItem.spec.ts
│ │ │ ├── PurchaseBatch.spec.ts
│ │ │ └── PurchaseOrder.spec.ts
│ │ │
│ │ └── products/
│ │ └── domain/
│ │ ├── Product.spec.ts
│ │ └── Recipe.spec.ts
│ │
│ ├── integration/
│ │ ├── categories/
│ │ │ └── CategoryController.spec.ts
│ │ │
│ │ ├── ingredients/
│ │ │ └── IngredientController.spec.ts
│ │ │
│ │ ├── inventory/
│ │ │ ├── InventoryController.spec.ts
│ │ │ └── PurchaseOrderController.spec.ts
│ │ │
│ │ └── products/
│ │ └── ProductController.spec.ts
│ │
│ ├── e2e/
│ │ ├── categories.e2e-spec.ts
│ │ ├── ingredients.e2e-spec.ts
│ │ ├── inventory.e2e-spec.ts
│ │ └── products.e2e-spec.ts
│ │
│ └── fixtures/
│ ├── categories.fixture.ts
│ ├── ingredients.fixture.ts
│ ├── inventory.fixture.ts
│ └── products.fixture.ts
│
├── docs/ # Documentación
│ ├── architecture/
│ │ ├── onion-architecture.md
│ │ ├── ddd-patterns.md
│ │ └── module-structure.md
│ │
│ ├── api/
│ │ ├── categories.md
│ │ ├── ingredients.md
│ │ ├── inventory.md
│ │ └── products.md
│ │
│ ├── domain/
│ │ ├── business-rules.md
│ │ ├── aggregates.md
│ │ └── value-objects.md
│ │
│ └── diagrams/
│ ├── domain-model.png
│ ├── module-dependencies.png
│ └── database-schema.png
│
├── scripts/ # Scripts de utilidad
│ ├── seed-database.ts
│ ├── generate-migration.ts
│ └── run-migrations.ts
│
├── .env.example
├── .env.development
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md

1. ✅ Shared (base classes y value objects comunes)
2. ✅ Categories (ya desarrollado según dijiste)
3. ➡️ Ingredients (siguiente a desarrollar)
4. ➡️ Inventory (depende de Ingredients)
5. ➡️ Products (depende de Categories e Ingredients)
6. ⏭️ Orders (depende de Products, Tables)
7. ⏭️ Tables (relativamente independiente)
8. ⏭️ Payments (depende de Orders)
9. ⏭️ Delivery (depende de Orders)
10. ⏭️ Staff (relativamente independiente)

Mi Recomendación: Opción 4 (Response DTO + Mapper)

Estructura de archivos:

src/modules/ingredient-categories/application/
├── create/
│ ├── create-ingredient-category.ts # Use Case
│ └── create-ingredient-category.handler.ts # Command Handler
├── find-by-id/
│ ├── find-ingredient-category-by-id.ts # Use Case
│ └── find-ingredient-category-by-id.handler.ts # Query Handler
├── find-all/
│ ├── find-all-ingredient-categories.ts # Use Case
│ └── find-all-ingredient-categories.handler.ts # Query Handler
├── dto/
│ ├── ingredient-category.response.ts # Response DTO
│ └── ingredient-category-list.response.ts # Response para listas (opcional)
└── mappers/
└── ingredient-category.mapper.ts # Mapper Domain → DTO

Implementación completa:

// ============================================
// DTO
// ============================================
// src/modules/ingredient-categories/application/dto/ingredient-category.response.ts
export class IngredientCategoryResponse {
readonly id: string
readonly name: string
readonly description: string | null
readonly icon: string | null
readonly color: string | null
readonly sortOrder: number | null
readonly isActive: boolean
}

// ============================================
// MAPPER
// ============================================
// src/modules/ingredient-categories/application/mappers/ingredient-category.mapper.ts
import { IngredientCategory } from '../../domain/ingredient-category'
import { IngredientCategoryResponse } from '../dto/ingredient-category.response'

export class IngredientCategoryMapper {
static toResponse(category: IngredientCategory): IngredientCategoryResponse {
const primitives = category.toPrimitives()

      return {
        id: primitives.id,
        name: primitives.name,
        description: primitives.description,
        icon: primitives.icon,
        color: primitives.color,
        sortOrder: primitives.sortOrden, // ← Puedes renombrar aquí
        isActive: primitives.isActive
      }
    }

    static toResponseList(categories: IngredientCategory[]): IngredientCategoryResponse[] {
      return categories.map(category => this.toResponse(category))
    }

}

// ============================================
// USE CASES
// ============================================
// src/modules/ingredient-categories/application/find-by-id/find-ingredient-category-by-id.ts
import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'
import { IngredientCategoryId } from '../../domain/ingredient-category-id'
import { IngredientCategoryNotFoundError } from
'../../domain/exceptions/ingredient-category-not-found.error'
import { IngredientCategoryMapper } from '../mappers/ingredient-category.mapper'
import { IngredientCategoryResponse } from '../dto/ingredient-category.response'

export class FindIngredientCategoryByIdUseCase {
constructor(
private readonly repository: IngredientCategoryRepository
) {}

    async run(id: string): Promise<IngredientCategoryResponse> {
      const categoryId = new IngredientCategoryId(id)
      const category = await this.repository.search(categoryId)

      if (!category) {
        throw new IngredientCategoryNotFoundError(id)
      }

      return IngredientCategoryMapper.toResponse(category)
    }

}

// src/modules/ingredient-categories/application/find-all/find-all-ingredient-categories.ts
export class FindAllIngredientCategoriesUseCase {
constructor(
private readonly repository: IngredientCategoryRepository
) {}

    async run(): Promise<IngredientCategoryResponse[]> {
      const categories = await this.repository.searchAll()
      return IngredientCategoryMapper.toResponseList(categories)
    }

}

// ============================================
// HANDLERS (CQRS)
// ============================================
// src/modules/ingredient-categories/application/find-by-id/find-ingredient-category-by-id.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindIngredientCategoryByIdQuery } from './find-ingredient-category-by-id.query'
import { FindIngredientCategoryByIdUseCase } from './find-ingredient-category-by-id'
import { IngredientCategoryResponse } from '../dto/ingredient-category.response'

@QueryHandler(FindIngredientCategoryByIdQuery)
export class FindIngredientCategoryByIdQueryHandler
implements IQueryHandler<FindIngredientCategoryByIdQuery> {

    constructor(
      private readonly useCase: FindIngredientCategoryByIdUseCase
    ) {}

    async execute(query: FindIngredientCategoryByIdQuery): Promise<IngredientCategoryResponse> {
      return this.useCase.run(query.id)
    }

}

// ============================================
// CONTROLLER
// ============================================
// src/modules/ingredient-categories/presentation/http/controllers/ingredient-category.controller.ts
import { Controller, Get, Param } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { FindIngredientCategoryByIdQuery } from
'../../../application/find-by-id/find-ingredient-category-by-id.query'
import { IngredientCategoryResponse } from '../../../application/dto/ingredient-category.response'

@Controller('ingredient-categories')
export class IngredientCategoryController {
constructor(private readonly queryBus: QueryBus) {}

    @Get(':id')
    async findById(@Param('id') id: string): Promise<IngredientCategoryResponse> {
      return this.queryBus.execute(new FindIngredientCategoryByIdQuery(id))
    }

    @Get()
    async findAll(): Promise<IngredientCategoryResponse[]> {
      return this.queryBus.execute(new FindAllIngredientCategoriesQuery())
    }

}
