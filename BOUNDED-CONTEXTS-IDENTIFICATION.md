# 🎯 Identificación de Bounded Contexts - La Sanguchería POS

**Fecha:** 2025-11-04
**Objetivo:** Identificar los verdaderos Bounded Contexts del sistema y proponer nueva estructura

---

## 📊 Análisis de la Estructura Actual

### Módulos Existentes

```
src/modules/
├── ingredient-categories/       ← 8 archivos
├── ingredient-transformations/  ← 12 archivos
├── ingredients/                 ← 15 archivos
├── inventory/                   ← 20 archivos
├── product-categories/          ← 10 archivos
├── products/                    ← 25 archivos
├── unit-conversions/            ← 8 archivos
└── units/                       ← 12 archivos
```

**Total:** 8 "módulos" que realmente son **conceptos mezclados**.

---

## 🔍 Análisis por Concepto

### 1. **Product** (Producto)

**Archivos analizados:**
- `Product`: SKU, precio, nombre, imagen, categoría, receta
- `ProductCategory`: Organización del menú

**Lenguaje Ubicuo:**
- "Este **producto** se vende por $25 soles"
- "El **producto** está en el menú en la categoría Sandwiches"
- "El **producto** tiene una imagen para mostrar al cliente"
- "El **producto** se muestra en el orden 5 del menú"

**Pregunta:** ¿De qué habla Product?
- ✅ **Venta**: Precio, SKU, presentación al cliente
- ✅ **Catálogo**: Menú, categorías, display
- ❌ **NO** habla de stock ni inventario directamente

**Conclusión:** Product pertenece al contexto de **CATÁLOGO/VENTAS**.

---

### 2. **Ingredient** (Ingrediente)

**Archivos analizados:**
- `Ingredient`: Nombre, categoría, unidad, stock mínimo/máximo, proveedor
- `IngredientCategory`: Organización de ingredientes

**Lenguaje Ubicuo:**
- "El **ingrediente** Tomate tiene un stock mínimo de 10kg"
- "El **ingrediente** es perecedero, dura 7 días"
- "El **ingrediente** se almacena en refrigerador"
- "El proveedor preferido del **ingrediente** es FreshFoods"

**Pregunta:** ¿De qué habla Ingredient?
- ✅ **Compras**: Proveedor preferido, stock mínimo/máximo
- ✅ **Almacenamiento**: Ubicación, perecedero, vida útil
- ✅ **Inventario**: Niveles de stock, reorden
- ❌ **NO** habla de recetas ni preparación

**Conclusión:** Ingredient pertenece al contexto de **INVENTARIO/COMPRAS**.

---

### 3. **Inventory** (Inventario)

**Archivos analizados:**
- `InventoryLevel`: Cantidad actual, alertas de stock
- `InventoryBatch`: Lotes FIFO, costos
- `InventoryMovement`: Entradas, salidas, ajustes

**Lenguaje Ubicuo:**
- "El **nivel de inventario** del tomate es 5kg"
- "El **lote** 123 cuesta $10 por kg (FIFO)"
- "Registrar **movimiento** de entrada: +20kg"
- "Detectar **stock bajo**: Tomate < 10kg"

**Pregunta:** ¿De qué habla Inventory?
- ✅ **Stock**: Niveles actuales, movimientos
- ✅ **Costos**: FIFO, valoración de inventario
- ✅ **Alertas**: Stock bajo, reorden
- ❌ **NO** habla de qué es el ingrediente

**Conclusión:** Inventory es un **BOUNDED CONTEXT COMPLETO**.

---

### 4. **Recipe** (Receta)

**Archivos analizados:**
- `Recipe`: Lista de ingredientes, cantidades, rendimiento
- `RecipeItem`: Ingrediente + cantidad en la receta

**Lenguaje Ubicuo:**
- "La **receta** del Sandwich Clásico usa 100g de jamón"
- "La **receta** rinde 1 unidad de producto"
- "La **receta** tiene 5 ingredientes"

**Pregunta:** ¿De qué habla Recipe?
- ✅ **Producción**: Cómo preparar el producto
- ✅ **Costos**: Cálculo de costo por ingredientes
- ✅ **Cocina**: Qué ingredientes usar
- ❌ **NO** habla de stock ni ventas directamente

**Conclusión:** Recipe pertenece a un contexto de **PRODUCCIÓN/COCINA**.

---

### 5. **Transformation** (Transformación)

**Archivos analizados:**
- `IngredientTransformation`: Convertir ingrediente A en ingrediente B
- `PreparationRecipe`: Receta de transformación

**Lenguaje Ubicuo:**
- "**Transformar** 1kg de pollo crudo → 800g de pollo cocido"
- "La **transformación** tiene 20% de merma"
- "**Preparar** carne asada desde carne cruda"

**Pregunta:** ¿De qué habla Transformation?
- ✅ **Producción**: Preparaciones previas en cocina
- ✅ **Merma**: Pérdida en transformación
- ✅ **Procesos**: Pasos de preparación
- ❌ **NO** habla de ventas ni catálogo

**Conclusión:** Transformation pertenece al contexto de **PRODUCCIÓN/COCINA**.

---

### 6. **Units** y **UnitConversions**

**Lenguaje Ubicuo:**
- "1 kg = 1000 gramos"
- "1 litro = 1000 mililitros"
- "Convertir 500g a kg"

**Pregunta:** ¿De qué habla Units?
- ✅ **Medición**: Sistema métrico
- ✅ **Conversión**: Entre unidades
- ✅ **Universal**: Usado por todos los contextos

**Conclusión:** Units es **SHARED KERNEL** (kernel compartido).

---

## 🎯 Identificación de Bounded Contexts

### Aplicando los Tests de DDD

#### Test 1: ¿Tienen lenguaje ubicuo diferente?

| Concepto | En Catalog | En Inventory | En Kitchen |
|----------|-----------|-------------|-----------|
| **Product** | "Ítem del menú para vender" | - | - |
| **Ingredient** | - | "Material con stock" | "Insumo para cocinar" |
| **Recipe** | - | - | "Instrucciones de preparación" |
| **Stock** | - | "Cantidad disponible" | - |

✅ **SÍ**, cada contexto habla diferente idioma.

---

#### Test 2: ¿Pueden cambiar independientemente?

- ¿Cambiar precio de Product afecta Inventory? ❌ NO
- ¿Cambiar stock de Ingredient afecta Recipe? ❌ NO
- ¿Cambiar Recipe afecta Product en Catalog? ❌ NO

✅ **SÍ**, pueden cambiar independientemente.

---

#### Test 3: ¿Podrían ser equipos separados?

- **Team Catalog**: Gestiona productos del menú, imágenes, precios
- **Team Inventory**: Gestiona stock, compras, proveedores
- **Team Kitchen**: Gestiona recetas, preparaciones, producción

✅ **SÍ**, podrían ser equipos diferentes.

---

#### Test 4: ¿Podrían ser microservicios?

- **Catalog Service**: API de productos para el POS
- **Inventory Service**: API de stock, alertas, FIFO
- **Kitchen Service**: API de recetas, órdenes de producción

✅ **SÍ**, tienen sentido como servicios separados.

---

## 🏗️ Bounded Contexts Identificados

### 1. **CATALOG Context** (Catálogo)

**Responsabilidad:** Gestión del catálogo de productos para venta

**Agregados:**
- `Product` (Aggregate Root)
- `ProductCategory` (Aggregate Root)

**Lenguaje Ubicuo:**
- Product, SKU, Price, Menu, Category, Image, Display Order
- "¿Qué productos tenemos en el menú?"
- "¿Cuánto cuesta el Sandwich Clásico?"

**Eventos de Dominio:**
- ProductCreated
- ProductPriceChanged
- ProductActivated
- ProductDeactivated

**Consultas Comunes:**
- Listar productos del menú
- Buscar producto por SKU
- Productos por categoría

---

### 2. **INVENTORY Context** (Inventario)

**Responsabilidad:** Gestión de stock de ingredientes

**Agregados:**
- `Ingredient` (Aggregate Root - Catálogo de ingredientes)
- `IngredientCategory` (Aggregate Root)
- `InventoryLevel` (Aggregate Root - Niveles de stock)
  - `InventoryMovement` (Entity)
- `InventoryBatch` (Aggregate Root - Lotes FIFO)

**Lenguaje Ubicuo:**
- Stock, Batch, FIFO, Movement, Supplier, Reorder Point
- "¿Cuánto stock tenemos de tomate?"
- "¿Cuál es el costo FIFO del jamón?"

**Eventos de Dominio:**
- IngredientCreated
- LowStockDetected
- OutOfStock
- BatchExhausted
- PurchaseRegistered

**Consultas Comunes:**
- Nivel actual de inventario
- Ingredientes con stock bajo
- Valoración de inventario (FIFO)
- Historial de movimientos

---

### 3. **PRODUCTION Context** (Producción/Cocina)

**Responsabilidad:** Gestión de recetas y transformaciones

**Agregados:**
- `Recipe` (Aggregate Root)
  - `RecipeItem` (Entity)
- `IngredientTransformation` (Aggregate Root)
- `PreparationRecipe` (Aggregate Root)

**Lenguaje Ubicuo:**
- Recipe, Ingredient Item, Yield, Preparation, Transformation, Waste
- "¿Cómo se prepara el Sandwich Clásico?"
- "¿Cuánto rinde la receta de pollo asado?"

**Eventos de Dominio:**
- RecipeCreated
- RecipeUpdated
- IngredientTransformed
- AbnormalWasteDetected

**Consultas Comunes:**
- Receta de un producto
- Costo de ingredientes de una receta
- Transformaciones disponibles

---

### 4. **SHARED KERNEL** (Kernel Compartido)

**Responsabilidad:** Conceptos compartidos entre contextos

**Agregados:**
- `Unit` (Aggregate Root)
- `UnitConversion` (Aggregate Root)

**Value Objects Compartidos:**
- `Money`
- `Quantity`
- `Uuid`
- `CreatedAt`

**Usado por:**
- ✅ Catalog (precios)
- ✅ Inventory (cantidades)
- ✅ Production (cantidades en recetas)

---

## 🗺️ Context Map (Mapa de Contextos)

### Relaciones entre Contextos

```
┌─────────────────────┐
│   CATALOG           │
│   (Upstream)        │
│                     │
│   - Product         │
│   - ProductCategory │
└──────────┬──────────┘
           │
           │ Published Language
           │ ProductCreated(productId, recipeId)
           │
           ▼
┌─────────────────────────────┐
│   PRODUCTION                │
│   (Downstream)              │
│                             │
│   - Recipe                  │
│   - Transformation          │
│                             │
│   Subscriber:               │
│   OnProductCreated          │
│     → LinkRecipe            │
└─────────────┬───────────────┘
              │
              │ Domain Event
              │ RecipeUsed(recipeId, ingredientIds)
              │
              ▼
┌─────────────────────────────┐
│   INVENTORY                 │
│   (Downstream)              │
│                             │
│   - InventoryLevel          │
│   - InventoryBatch          │
│   - Ingredient              │
│                             │
│   Subscriber:               │
│   OnRecipeUsed              │
│     → DeductIngredients     │
│                             │
│   Publisher:                │
│   LowStockDetected          │
└─────────────────────────────┘
```

---

## 📁 Propuesta de Nueva Estructura

### Estructura por Bounded Contexts

```
src/
├── contexts/                           ← Bounded Contexts
│   │
│   ├── catalog/                        ← CATALOG CONTEXT
│   │   ├── README.md
│   │   ├── UBIQUITOUS-LANGUAGE.md
│   │   │
│   │   ├── domain/
│   │   │   ├── product/
│   │   │   │   ├── product.ts                  (Aggregate Root)
│   │   │   │   ├── product-id.ts
│   │   │   │   ├── product-name.ts
│   │   │   │   ├── product-price.ts
│   │   │   │   ├── product-sku.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── product-created.event.ts
│   │   │   │   │   └── product-price-changed.event.ts
│   │   │   │   └── repositories/
│   │   │   │       └── product.repository.ts
│   │   │   │
│   │   │   └── category/
│   │   │       ├── product-category.ts         (Aggregate Root)
│   │   │       └── repositories/
│   │   │
│   │   ├── application/
│   │   │   ├── product/
│   │   │   │   ├── create/
│   │   │   │   ├── update/
│   │   │   │   ├── delete/
│   │   │   │   └── queries/
│   │   │   │
│   │   │   └── category/
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   │   └── typeorm/
│   │   │   └── messaging/
│   │   │
│   │   ├── presentation/
│   │   │   └── http/
│   │   │       ├── controllers/
│   │   │       └── dto/
│   │   │
│   │   └── catalog.module.ts
│   │
│   ├── inventory/                      ← INVENTORY CONTEXT
│   │   ├── README.md
│   │   ├── UBIQUITOUS-LANGUAGE.md
│   │   │
│   │   ├── domain/
│   │   │   ├── ingredient/
│   │   │   │   ├── ingredient.ts               (Aggregate Root)
│   │   │   │   ├── ingredient-category.ts      (Aggregate Root)
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── stock-level/
│   │   │   │   ├── inventory-level.ts          (Aggregate Root)
│   │   │   │   ├── inventory-movement.ts       (Entity)
│   │   │   │   ├── events/
│   │   │   │   │   ├── low-stock-detected.event.ts
│   │   │   │   │   └── out-of-stock.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── batch/
│   │   │   │   ├── inventory-batch.ts          (Aggregate Root)
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   └── services/
│   │   │       └── fifo-inventory.service.ts
│   │   │
│   │   ├── application/
│   │   │   ├── ingredient/
│   │   │   ├── stock-level/
│   │   │   │   ├── register-purchase/
│   │   │   │   ├── deduct-stock/
│   │   │   │   └── queries/
│   │   │   │
│   │   │   ├── batch/
│   │   │   │
│   │   │   └── subscribers/
│   │   │       └── on-recipe-used.subscriber.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   └── messaging/
│   │   │
│   │   ├── presentation/
│   │   │   └── http/
│   │   │
│   │   └── inventory.module.ts
│   │
│   ├── production/                     ← PRODUCTION CONTEXT
│   │   ├── README.md
│   │   ├── UBIQUITOUS-LANGUAGE.md
│   │   │
│   │   ├── domain/
│   │   │   ├── recipe/
│   │   │   │   ├── recipe.ts                   (Aggregate Root)
│   │   │   │   ├── recipe-item.ts              (Entity)
│   │   │   │   ├── recipe-yield.ts
│   │   │   │   ├── events/
│   │   │   │   │   └── recipe-used.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   └── transformation/
│   │   │       ├── ingredient-transformation.ts (Aggregate Root)
│   │   │       ├── preparation-recipe.ts
│   │   │       ├── events/
│   │   │       │   └── ingredient-transformed.event.ts
│   │   │       └── repositories/
│   │   │
│   │   ├── application/
│   │   │   ├── recipe/
│   │   │   ├── transformation/
│   │   │   └── subscribers/
│   │   │       └── on-product-created.subscriber.ts
│   │   │
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── production.module.ts
│   │
│   └── shared-kernel/                  ← SHARED KERNEL
│       ├── domain/
│       │   ├── units/
│       │   │   ├── unit.ts                     (Aggregate Root)
│       │   │   ├── unit-conversion.ts          (Aggregate Root)
│       │   │   └── repositories/
│       │   │
│       │   └── value-objects/
│       │       ├── money.ts
│       │       ├── quantity.ts
│       │       ├── uuid.ts
│       │       └── created-at.ts
│       │
│       ├── application/
│       │   ├── units/
│       │   └── conversions/
│       │
│       ├── infrastructure/
│       └── shared-kernel.module.ts
│
├── shared/                             ← Infraestructura compartida
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── events/
│   │   │   ├── domain-event.ts
│   │   │   └── event-bus.ts
│   │   └── exceptions/
│   │
│   ├── application/
│   │   └── bus/
│   │
│   └── infrastructure/
│       ├── cqrs/
│       ├── event-bus/
│       ├── event-sourcing/
│       └── database/
│
└── modules/                            ← DEPRECATED (migrar gradualmente)
    └── ...
```

---

## 📋 Comparación: Antes vs Después

### Estructura Actual (Por "Módulos")

```
src/modules/
├── products/              ← ¿Qué es? ¿Catalog?
├── product-categories/    ← ¿Parte de products?
├── ingredients/           ← ¿Inventory? ¿Kitchen?
├── ingredient-categories/ ← ¿Parte de ingredients?
├── inventory/             ← ¿Solo stock?
├── units/                 ← ¿Shared?
└── unit-conversions/      ← ¿Parte de units?
```

**Problemas:**
- ❌ No hay fronteras claras
- ❌ Dependencias cruzadas confusas
- ❌ No se sabe qué pertenece a qué
- ❌ Difícil escalar

---

### Estructura Propuesta (Por Bounded Contexts)

```
src/contexts/
├── catalog/               ← Claro: Catálogo de productos
│   ├── product/
│   └── category/
│
├── inventory/             ← Claro: Gestión de stock
│   ├── ingredient/
│   ├── stock-level/
│   └── batch/
│
├── production/            ← Claro: Recetas y cocina
│   ├── recipe/
│   └── transformation/
│
└── shared-kernel/         ← Claro: Compartido
    └── units/
```

**Ventajas:**
- ✅ Fronteras claras
- ✅ Lenguaje ubicuo por contexto
- ✅ Fácil entender responsabilidades
- ✅ Preparado para microservicios

---

## 🔗 Integraciones entre Contextos

### 1. Catalog → Production

**Escenario:** Crear producto con receta

```typescript
// Catalog Context
class CreateProduct {
  async run(..., recipeId: string | null): Promise<void> {
    const product = Product.create(...)
    await this.productRepo.save(product)

    // Publicar evento
    await this.eventBus.publish(
      new ProductCreated({ productId, recipeId })
    )
  }
}

// Production Context (subscriber)
class OnProductCreated {
  async on(event: ProductCreated): Promise<void> {
    if (event.recipeId) {
      // Vincular producto con receta
      const recipe = await this.recipeRepo.findById(event.recipeId)
      // ...
    }
  }
}
```

---

### 2. Production → Inventory

**Escenario:** Usar receta (descontar ingredientes)

```typescript
// Production Context
class UseRecipe {
  async run(recipeId: string): Promise<void> {
    const recipe = await this.recipeRepo.findById(recipeId)

    // Publicar evento
    await this.eventBus.publish(
      new RecipeUsed({
        recipeId,
        ingredients: recipe.items.map(item => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity
        }))
      })
    )
  }
}

// Inventory Context (subscriber)
class OnRecipeUsed {
  async on(event: RecipeUsed): Promise<void> {
    for (const ingredient of event.ingredients) {
      // Descontar del inventario
      await this.deductStock.run(
        ingredient.ingredientId,
        ingredient.quantity
      )
    }
  }
}
```

---

### 3. Inventory → (Anyone)

**Escenario:** Alertas de stock bajo

```typescript
// Inventory Context
class InventoryLevel extends AggregateRoot {
  decrease(quantity: Quantity): void {
    this.currentQuantity = this.currentQuantity.subtract(quantity)

    if (this.isLowStock()) {
      this.record(new LowStockDetected({
        ingredientId: this.ingredientId.value,
        currentQuantity: this.currentQuantity.value,
        minimumQuantity: this.minimumQuantity.value
      }))
    }
  }
}

// Purchasing Context (futuro)
class OnLowStockDetected {
  async on(event: LowStockDetected): Promise<void> {
    // Crear orden de compra automática
    await this.createPurchaseOrder.run(event.ingredientId)
  }
}
```

---

## 📝 Lenguaje Ubicuo por Contexto

### Catalog Context

**Términos:**
- Product, SKU, Price, Category, Menu, Display Order, Tag
- Active/Inactive, Image, Description

**Frases Típicas:**
- "Agregar producto al menú"
- "Cambiar precio del producto"
- "Activar/desactivar producto"
- "Organizar productos por categoría"

---

### Inventory Context

**Términos:**
- Ingredient, Stock, Batch, FIFO, Movement, Level
- Supplier, Purchase, Reorder Point, Low Stock, Out of Stock
- Unit Cost, Valuation

**Frases Típicas:**
- "Registrar compra de ingrediente"
- "Descontar stock"
- "Calcular costo FIFO"
- "Detectar stock bajo"
- "Valoración de inventario"

---

### Production Context

**Términos:**
- Recipe, Ingredient Item, Yield, Preparation, Transformation
- Waste, Merma, Output, Input

**Frases Típicas:**
- "Crear receta para producto"
- "Transformar ingrediente crudo en cocido"
- "Calcular rendimiento de receta"
- "Detectar merma anormal"

---

## ✅ Beneficios de la Nueva Estructura

### 1. **Claridad Conceptual**
- ✅ Cada contexto tiene responsabilidad única
- ✅ Lenguaje ubicuo claro por contexto
- ✅ Fronteras bien definidas

### 2. **Escalabilidad**
- ✅ Fácil separar en microservicios
- ✅ Equipos pueden trabajar independientemente
- ✅ Deployment independiente

### 3. **Mantenibilidad**
- ✅ Cambios en un contexto no afectan otros
- ✅ Código más cohesivo
- ✅ Tests más focalizados

### 4. **Integración**
- ✅ Comunicación via eventos bien definidos
- ✅ Contratos claros entre contextos
- ✅ Eventual consistency donde corresponde

---

## 🚀 Siguiente Paso: Plan de Migración

Ver: [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) para el plan detallado de migración paso a paso.

---

**Resumen:** Tu proyecto tiene **3 Bounded Contexts principales** + 1 Shared Kernel:

1. **Catalog** (Products, Categories)
2. **Inventory** (Ingredients, Stock, Batches)
3. **Production** (Recipes, Transformations)
4. **Shared Kernel** (Units, Conversions)

Cada uno debe organizarse como contexto independiente con su propia estructura DDD completa.
