#!/bin/bash

# Script para actualizar imports de @/modules a @/contexts

echo "🔧 Fixing imports from @/modules to @/contexts..."

# Inventory Context - Ingredients
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredients/domain|@/contexts/inventory/ingredient/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredients/application|@/contexts/inventory/ingredient/application|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredients/infrastructure|@/contexts/inventory/ingredient/infrastructure|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredients/presentation|@/contexts/inventory/ingredient/presentation|g" {} +

# Inventory Context - Ingredient Categories
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredient-categories/domain|@/contexts/inventory/ingredient-category/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredient-categories/application|@/contexts/inventory/ingredient-category/application|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredient-categories/infrastructure|@/contexts/inventory/ingredient-category/infrastructure|g" {} +

# Inventory Context - Stock Level
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/inventory/domain/inventory-batch|@/contexts/inventory/batch/domain/inventory-batch|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/inventory/domain/inventory-level|@/contexts/inventory/stock-level/domain/inventory-level|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/inventory/domain/inventory-movement|@/contexts/inventory/stock-level/domain/inventory-movement|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/inventory/domain/movement-type|@/contexts/inventory/stock-level/domain/movement-type|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/inventory/domain/repositories|@/contexts/inventory/stock-level/domain/repositories|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/inventory/application|@/contexts/inventory/stock-level/application|g" {} +

# Shared Kernel - Units
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/units/domain|@/contexts/shared-kernel/unit/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/units/application|@/contexts/shared-kernel/unit/application|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/units/infrastructure|@/contexts/shared-kernel/unit/infrastructure|g" {} +

# Shared Kernel - Unit Conversions
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/unit-conversions/domain|@/contexts/shared-kernel/unit-conversion/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/unit-conversions/application|@/contexts/shared-kernel/unit-conversion/application|g" {} +

# Menu Context - Products
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/products/domain|@/contexts/menu/product/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/products/application|@/contexts/menu/product/application|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/products/infrastructure|@/contexts/menu/product/infrastructure|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/products/presentation|@/contexts/menu/product/presentation|g" {} +

# Menu Context - Product Categories
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/product-categories/domain|@/contexts/menu/product-category/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/product-categories/application|@/contexts/menu/product-category/application|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/product-categories/infrastructure|@/contexts/menu/product-category/infrastructure|g" {} +

# Kitchen Context - Transformations
find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredient-transformations/domain|@/contexts/kitchen/transformation/domain|g" {} +

find src/contexts -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/ingredient-transformations/application|@/contexts/kitchen/transformation/application|g" {} +

echo "✅ Imports fixed!"
echo "🔍 Running TypeScript compilation check..."

pnpm tsc --noEmit
