# 🏗️ Estructura Final de Bounded Contexts

**Fecha:** 2025-11-04
**Decisión:** Usar lenguaje ubicuo del negocio (Menu, Kitchen)
**Status:** ✅ APROBADA

---

## 🎯 Bounded Contexts Finales

Tu sistema POS tendrá **3 Bounded Contexts** + 1 Shared Kernel:

### 1. **MENU Context** (antes "Catalog")
**Lenguaje del negocio:** "Menú del restaurante"
**Responsabilidad:** Gestión del menú de productos para venta

### 2. **INVENTORY Context**
**Lenguaje del negocio:** "Inventario/Stock"
**Responsabilidad:** Gestión de ingredientes y niveles de stock

### 3. **KITCHEN Context** (antes "Production")
**Lenguaje del negocio:** "Cocina"
**Responsabilidad:** Gestión de recetas y transformaciones

### 4. **SHARED KERNEL**
**Lenguaje del negocio:** Universal
**Responsabilidad:** Unidades de medida y conversiones

---

## 📁 Estructura Completa

```
src/contexts/
│
├── menu/                                    ← MENU CONTEXT
│   │
│   ├── domain/
│   │   ├── product/                         ← Mantener nombre "Product"
│   │   │   ├── product.ts                   (Aggregate Root)
│   │   │   ├── product-id.ts
│   │   │   ├── product-name.ts
│   │   │   ├── product-price.ts
│   │   │   ├── product-sku.ts
│   │   │   ├── product-tags.ts
│   │   │   ├── events/
│   │   │   │   ├── product-created.event.ts
│   │   │   │   ├── product-updated.event.ts
│   │   │   │   └── product-price-changed.event.ts
│   │   │   └── repositories/
│   │   │       └── product.repository.ts
│   │   │
│   │   └── category/
│   │       ├── product-category.ts          (Aggregate Root)
│   │       ├── product-category-id.ts
│   │       ├── product-category-name.ts
│   │       ├── events/
│   │       │   └── category-created.event.ts
│   │       └── repositories/
│   │           └── product-category.repository.ts
│   │
│   ├── application/
│   │   ├── product/
│   │   │   ├── create/
│   │   │   │   ├── create-product.ts
│   │   │   │   ├── create-product.command.ts
│   │   │   │   └── create-product.handler.ts
│   │   │   ├── update/
│   │   │   │   ├── update-product.ts
│   │   │   │   ├── update-product.command.ts
│   │   │   │   └── update-product.handler.ts
│   │   │   ├── delete/
│   │   │   │   ├── delete-product.ts
│   │   │   │   ├── delete-product.command.ts
│   │   │   │   └── delete-product.handler.ts
│   │   │   ├── find/
│   │   │   │   ├── find-product.ts
│   │   │   │   ├── find-product.query.ts
│   │   │   │   └── find-product.handler.ts
│   │   │   └── search-by-criteria/
│   │   │       ├── search-products-by-criteria.ts
│   │   │       ├── search-products-by-criteria.query.ts
│   │   │       └── search-products-by-criteria.handler.ts
│   │   │
│   │   ├── category/
│   │   │   ├── create/
│   │   │   ├── update/
│   │   │   └── find-all/
│   │   │
│   │   └── dto/
│   │       ├── product.response.ts
│   │       └── product-list.response.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── typeorm/
│   │   │       ├── product.entity.ts
│   │   │       ├── product-category.entity.ts
│   │   │       ├── typeorm-product.repository.ts
│   │   │       └── typeorm-product-category.repository.ts
│   │   │
│   │   └── messaging/
│   │       └── events/
│   │           └── (futuros subscribers de otros contextos)
│   │
│   ├── presentation/
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── product.controller.ts
│   │       │   └── product-category.controller.ts
│   │       └── dto/
│   │           ├── create-product.request.ts
│   │           ├── update-product.request.ts
│   │           └── search-products.request.ts
│   │
│   ├── README.md                            ← Documentación del contexto
│   └── menu.module.ts                       ← NestJS module
│
├── inventory/                               ← INVENTORY CONTEXT
│   │
│   ├── domain/
│   │   ├── ingredient/
│   │   │   ├── ingredient.ts                (Aggregate Root)
│   │   │   ├── ingredient-id.ts
│   │   │   ├── ingredient-name.ts
│   │   │   ├── ingredient-category.ts       (Aggregate Root)
│   │   │   ├── events/
│   │   │   │   └── ingredient-created.event.ts
│   │   │   └── repositories/
│   │   │       └── ingredient.repository.ts
│   │   │
│   │   ├── stock-level/
│   │   │   ├── inventory-level.ts           (Aggregate Root)
│   │   │   ├── inventory-level-id.ts
│   │   │   ├── inventory-movement.ts        (Entity - NO Aggregate)
│   │   │   ├── inventory-movement-id.ts
│   │   │   ├── movement-type.ts
│   │   │   ├── events/
│   │   │   │   ├── low-stock-detected.event.ts
│   │   │   │   └── out-of-stock.event.ts
│   │   │   └── repositories/
│   │   │       └── inventory-level.repository.ts
│   │   │
│   │   ├── batch/
│   │   │   ├── inventory-batch.ts           (Aggregate Root)
│   │   │   ├── inventory-batch-id.ts
│   │   │   └── repositories/
│   │   │       └── inventory-batch.repository.ts
│   │   │
│   │   └── services/
│   │       └── fifo-inventory.service.ts
│   │
│   ├── application/
│   │   ├── ingredient/
│   │   │   ├── create/
│   │   │   ├── find/
│   │   │   └── find-all/
│   │   │
│   │   ├── stock-level/
│   │   │   ├── register-purchase/
│   │   │   │   ├── register-purchase.ts
│   │   │   │   ├── register-purchase.command.ts
│   │   │   │   └── register-purchase.handler.ts
│   │   │   ├── deduct-stock/
│   │   │   │   ├── deduct-ingredient.ts
│   │   │   │   ├── deduct-ingredient.command.ts
│   │   │   │   └── deduct-ingredient.handler.ts
│   │   │   └── queries/
│   │   │       ├── get-inventory-levels/
│   │   │       ├── get-inventory-valuation/
│   │   │       └── get-movement-history/
│   │   │
│   │   ├── batch/
│   │   │   └── queries/
│   │   │
│   │   └── subscribers/
│   │       ├── on-recipe-used.subscriber.ts     ← Escucha Kitchen Context
│   │       └── log-stock-alerts.subscriber.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── typeorm/
│   │   │       ├── ingredient.entity.ts
│   │   │       ├── ingredient-category.entity.ts
│   │   │       ├── inventory-level.entity.ts
│   │   │       ├── inventory-movement.entity.ts
│   │   │       ├── inventory-batch.entity.ts
│   │   │       └── (repositories)
│   │   │
│   │   └── messaging/
│   │       └── events/
│   │
│   ├── presentation/
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── ingredient.controller.ts
│   │       │   ├── inventory-level.controller.ts
│   │       │   └── inventory-batch.controller.ts
│   │       └── dto/
│   │
│   ├── README.md
│   └── inventory.module.ts
│
├── kitchen/                                 ← KITCHEN CONTEXT
│   │
│   ├── domain/
│   │   ├── recipe/
│   │   │   ├── recipe.ts                    (Aggregate Root)
│   │   │   ├── recipe-id.ts
│   │   │   ├── recipe-name.ts
│   │   │   ├── recipe-item.ts               (Entity)
│   │   │   ├── recipe-yield.ts
│   │   │   ├── events/
│   │   │   │   ├── recipe-created.event.ts
│   │   │   │   └── recipe-used.event.ts
│   │   │   └── repositories/
│   │   │       └── recipe.repository.ts
│   │   │
│   │   └── transformation/
│   │       ├── ingredient-transformation.ts (Aggregate Root)
│   │       ├── transformation-id.ts
│   │       ├── preparation-recipe.ts
│   │       ├── yield-percentage.ts
│   │       ├── events/
│   │       │   ├── ingredient-transformed.event.ts
│   │       │   └── abnormal-waste-detected.event.ts
│   │       └── repositories/
│   │           └── transformation.repository.ts
│   │
│   ├── application/
│   │   ├── recipe/
│   │   │   ├── create/
│   │   │   │   ├── create-recipe.ts
│   │   │   │   ├── create-recipe.command.ts
│   │   │   │   └── create-recipe.handler.ts
│   │   │   ├── use-recipe/
│   │   │   │   ├── use-recipe.ts
│   │   │   │   ├── use-recipe.command.ts
│   │   │   │   └── use-recipe.handler.ts
│   │   │   └── queries/
│   │   │
│   │   ├── transformation/
│   │   │   ├── register-transformation/
│   │   │   └── queries/
│   │   │
│   │   └── subscribers/
│   │       └── on-product-created.subscriber.ts  ← Escucha Menu Context
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── typeorm/
│   │   │       ├── recipe.entity.ts
│   │   │       ├── recipe-item.entity.ts
│   │   │       ├── ingredient-transformation.entity.ts
│   │   │       └── preparation-recipe.entity.ts
│   │   │
│   │   └── messaging/
│   │
│   ├── presentation/
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── recipe.controller.ts
│   │       │   └── transformation.controller.ts
│   │       └── dto/
│   │
│   ├── README.md
│   └── kitchen.module.ts
│
└── shared-kernel/                           ← SHARED KERNEL
    │
    ├── domain/
    │   ├── units/
    │   │   ├── unit.ts                      (Aggregate Root)
    │   │   ├── unit-id.ts
    │   │   ├── unit-type.ts
    │   │   ├── unit-conversion.ts           (Aggregate Root)
    │   │   ├── conversion-factor.ts
    │   │   ├── events/
    │   │   │   ├── unit-created.event.ts
    │   │   │   └── unit-conversion-created.event.ts
    │   │   └── repositories/
    │   │       ├── unit.repository.ts
    │   │       └── unit-conversion.repository.ts
    │   │
    │   └── value-objects/
    │       ├── money.ts
    │       ├── quantity.ts
    │       ├── uuid.ts
    │       ├── string.ts
    │       ├── number.ts
    │       ├── boolean.ts
    │       ├── created-at.ts
    │       ├── email.ts
    │       └── phone.ts
    │
    ├── application/
    │   ├── units/
    │   │   ├── create/
    │   │   ├── update/
    │   │   ├── delete/
    │   │   └── find-all/
    │   │
    │   └── conversions/
    │       ├── convert-quantity/
    │       └── seed-common-conversions/
    │
    ├── infrastructure/
    │   ├── persistence/
    │   │   └── typeorm/
    │   │       ├── unit.entity.ts
    │   │       ├── unit-conversion.entity.ts
    │   │       ├── typeorm-unit.repository.ts
    │   │       └── typeorm-unit-conversion.repository.ts
    │   │
    │   └── seed-common-conversions.ts
    │
    ├── presentation/
    │   └── http/
    │       ├── controllers/
    │       │   └── units.controller.ts
    │       └── dto/
    │
    └── shared-kernel.module.ts
```

---

## 🔗 Context Map (Mapa de Integraciones)

```
┌──────────────────┐
│  MENU CONTEXT    │
│  (upstream)      │
│                  │
│  Publica:        │
│  - ProductCreated│
│  - ProductUpdated│
│  - PriceChanged  │
└────────┬─────────┘
         │
         │ (1) ProductCreated(productId, recipeId)
         │
         ▼
┌──────────────────────┐
│  KITCHEN CONTEXT     │
│  (downstream)        │
│                      │
│  Escucha:            │
│  - ProductCreated    │
│                      │
│  Publica:            │
│  - RecipeUsed        │
└──────────┬───────────┘
           │
           │ (2) RecipeUsed(ingredients[])
           │
           ▼
┌──────────────────────────┐
│  INVENTORY CONTEXT       │
│  (downstream)            │
│                          │
│  Escucha:                │
│  - RecipeUsed            │
│                          │
│  Publica:                │
│  - LowStockDetected      │
│  - OutOfStock            │
└──────────────────────────┘
```

### Flujo de Eventos:

1. **Menu → Kitchen:**
   - Cuando se crea un Product con Recipe, Kitchen vincula la receta

2. **Kitchen → Inventory:**
   - Cuando se usa una Recipe, Inventory deduce ingredientes

3. **Inventory → (Futuro Purchasing):**
   - Cuando hay LowStock, se puede crear orden de compra automática

---

## 📊 Resumen de Agregados por Contexto

### Menu Context (2 agregados)
- ✅ `Product` (Aggregate Root)
- ✅ `ProductCategory` (Aggregate Root)

### Inventory Context (4 agregados)
- ✅ `Ingredient` (Aggregate Root)
- ✅ `IngredientCategory` (Aggregate Root)
- ✅ `InventoryLevel` (Aggregate Root)
  - `InventoryMovement` (Entity)
- ✅ `InventoryBatch` (Aggregate Root)

### Kitchen Context (2 agregados)
- ✅ `Recipe` (Aggregate Root)
  - `RecipeItem` (Entity)
- ✅ `IngredientTransformation` (Aggregate Root)

### Shared Kernel (2 agregados)
- ✅ `Unit` (Aggregate Root)
- ✅ `UnitConversion` (Aggregate Root)

**Total:** 10 Aggregate Roots + 2 Entities

---

## 🎯 Lenguaje Ubicuo por Contexto

### Menu Context
**Términos clave:**
- Product, SKU, Price, Category, Menu, Display Order, Tag
- Active/Inactive, Image, Preparation Time

**Frases típicas:**
- "Agregar producto al menú"
- "Cambiar precio del producto"
- "Activar/desactivar producto del menú"
- "Este producto cuesta $25"

---

### Inventory Context
**Términos clave:**
- Ingredient, Stock, Batch, FIFO, Movement, Level
- Supplier, Purchase, Reorder Point, Low Stock, Out of Stock
- Unit Cost, Valuation, Expiration Date

**Frases típicas:**
- "Registrar compra de ingrediente"
- "Descontar stock por uso en cocina"
- "Calcular costo FIFO del inventario"
- "Alertar cuando el stock está bajo"
- "Este lote vence en 7 días"

---

### Kitchen Context
**Términos clave:**
- Recipe, Ingredient Item, Yield, Preparation, Transformation
- Waste, Merma, Output, Input, Cook, Prepare

**Frases típicas:**
- "Crear receta para el Sandwich Clásico"
- "Esta receta rinde 1 unidad de producto"
- "Transformar pollo crudo en pollo cocido"
- "La transformación tiene 20% de merma"
- "Usar receta para preparar pedido"

---

### Shared Kernel
**Términos clave:**
- Unit, Conversion, Kilogram, Liter, Gram, Milliliter
- Convert, Factor, Quantity, Measurement

**Frases típicas:**
- "Convertir 500g a kg"
- "1 litro = 1000 mililitros"
- "Esta cantidad es en gramos"

---

## ⚙️ Path Aliases en tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/contexts/*": ["src/contexts/*"],
      "@/menu/*": ["src/contexts/menu/*"],
      "@/inventory/*": ["src/contexts/inventory/*"],
      "@/kitchen/*": ["src/contexts/kitchen/*"],
      "@/shared-kernel/*": ["src/contexts/shared-kernel/*"],
      "@/shared/*": ["src/shared/*"]
    }
  }
}
```

---

## 📝 Decisiones Clave de Nomenclatura

### ✅ Decisión 1: "Menu" en lugar de "Catalog"
**Razón:** Es el lenguaje del negocio (restaurantes)
**Impacto:** Contexto = `menu/`, pero clases = `Product` (no `MenuItem`)

### ✅ Decisión 2: "Kitchen" en lugar de "Production"
**Razón:** Es el lenguaje del negocio (cocina de restaurante)
**Impacto:** Contexto = `kitchen/`, clases = `Recipe`, `Transformation`

### ✅ Decisión 3: Mantener "Product" como nombre de clase
**Razón:**
- "Product" es término universal y técnico
- Evita breaking changes en BD y APIs
- El contexto `menu/` ya da el significado correcto

### ✅ Decisión 4: InventoryMovement como Entity
**Razón:**
- No existe independientemente de InventoryLevel
- Consistencia inmediata requerida
- Reduce complejidad transaccional

---

## 🚀 Estado del Plan de Migración

✅ **Plan completo listo** en [MIGRATION-PLAN.md](./MIGRATION-PLAN.md)

**Duración estimada:** 10-15 días
**Fases:** 6 fases incrementales
**Riesgo:** Bajo (estrategia Strangler Fig)

**Próximo paso:** Fase 1 - Preparación (1-2 días)

---

## 📚 Documentación Relacionada

- [BOUNDED-CONTEXTS-IDENTIFICATION.md](./BOUNDED-CONTEXTS-IDENTIFICATION.md) - Identificación detallada
- [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) - Plan de migración paso a paso
- [UBIQUITOUS-LANGUAGE-ANALYSIS.md](./UBIQUITOUS-LANGUAGE-ANALYSIS.md) - Análisis de lenguaje
- [AGGREGATE-DESIGN-ANALYSIS.md](./AGGREGATE-DESIGN-ANALYSIS.md) - Diseño de agregados
- [RECIPE-PRODUCT-RELATIONSHIP-ANALYSIS.md](./RECIPE-PRODUCT-RELATIONSHIP-ANALYSIS.md) - Relaciones entre contextos

---

**Resumen:** Tu sistema está listo para migrar a una arquitectura de Bounded Contexts usando el lenguaje real del negocio (Menu, Kitchen, Inventory). El plan es incremental, seguro y alineado con los principios de DDD.
