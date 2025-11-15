# 🚀 Plan de Migración a Bounded Contexts

**Fecha:** 2025-11-04
**Objetivo:** Migrar de estructura por "módulos" a Bounded Contexts
**Estrategia:** Migración gradual sin romper el sistema

---

## 🏗️ Decisión de Estructura

**Estructura elegida: Propuesta 2 (Organización por Agregados)**

```
src/contexts/menu/
├── product/                  ← Agregado
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
└── category/                 ← Agregado
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

**Razones de la decisión:**
- ✅ **Alta cohesión**: Todo lo relacionado con un agregado está junto
- ✅ **Equipos independientes**: Un equipo puede trabajar en product/ sin afectar category/
- ✅ **Microservicios ready**: Fácil extraer product/ a su propio servicio
- ✅ **Menos conflicts**: Cambios en product/ no tocan category/
- ✅ **Escalabilidad**: Agregar nuevos agregados es simple
- ✅ **Navegación**: Más rápido encontrar todo de un agregado

📄 **Ver análisis completo:** [STRUCTURE-COMPARISON-ANALYSIS.md](./STRUCTURE-COMPARISON-ANALYSIS.md)

---

## 📋 Principios de la Migración

### 1. **Migración Incremental**
- ✅ NO reescribir todo de una vez
- ✅ Migrar contexto por contexto
- ✅ El sistema funciona en todo momento
- ✅ Cada paso es deployable

### 2. **Estrategia Strangler Fig**
- Crear nuevo código en `contexts/`
- Mantener código viejo en `modules/` funcionando
- Redirigir gradualmente a lo nuevo
- Eliminar lo viejo cuando ya no se use

### 3. **Testing Continuo**
- Todos los tests deben pasar en cada paso
- Agregar tests de integración entre contextos
- Verificar eventos de dominio

---

## 🎯 Orden de Migración

### Fase 1: Preparación (1-2 días)

**Objetivo:** Preparar infraestructura base

#### Paso 1.1: Crear estructura de carpetas

```bash
mkdir -p src/contexts
mkdir -p src/contexts/shared-kernel
mkdir -p src/contexts/catalog
mkdir -p src/contexts/inventory
mkdir -p src/contexts/production
```

#### Paso 1.2: Mover Shared Kernel (Units)

**Por qué primero:** Units es usado por todos los contextos, debe estar disponible primero.

**Acciones:**
```bash
# Crear estructura
mkdir -p src/contexts/shared-kernel/domain/units
mkdir -p src/contexts/shared-kernel/domain/value-objects
mkdir -p src/contexts/shared-kernel/application/units
mkdir -p src/contexts/shared-kernel/infrastructure/persistence/typeorm

# Copiar (NO mover aún) archivos
cp -r src/modules/units/domain/* src/contexts/shared-kernel/domain/units/
cp -r src/modules/units/application/* src/contexts/shared-kernel/application/units/
cp -r src/modules/units/infrastructure/* src/contexts/shared-kernel/infrastructure/

# Copiar unit-conversions también
cp -r src/modules/unit-conversions/domain/* src/contexts/shared-kernel/domain/units/
```

**Actualizar imports:**
```typescript
// Antes
import { Unit } from '@/modules/units/domain/unit'

// Después
import { Unit } from '@/contexts/shared-kernel/domain/units/unit'
```

**Actualizar path aliases en tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/contexts/*": ["src/contexts/*"],
      "@/shared-kernel/*": ["src/contexts/shared-kernel/*"],
      "@/modules/*": ["src/modules/*"]  // Mantener por ahora
    }
  }
}
```

**Verificación:**
```bash
pnpm tsc --noEmit
pnpm test
```

**Criterio de éxito:**
- ✅ Compilación exitosa
- ✅ Todos los tests pasan
- ✅ Shared kernel accessible desde `@/shared-kernel/*`

---

### Fase 2: Migrar Menu Context (2-3 días)

**Objetivo:** Mover Products y ProductCategories al contexto Menu

**IMPORTANTE:** Mantener nombres de clases (`Product`, `ProductCategory`) pero cambiar el contexto a `menu/`

#### Paso 2.1: Crear estructura de Menu

**IMPORTANTE:** Usando **Propuesta 2** (Organización por Agregados) - Recomendada por análisis de estructura (ver STRUCTURE-COMPARISON-ANALYSIS.md)

```bash
# Estructura por agregados (cada agregado tiene sus propias capas)
mkdir -p src/contexts/menu/product/domain
mkdir -p src/contexts/menu/product/domain/events
mkdir -p src/contexts/menu/product/domain/exceptions
mkdir -p src/contexts/menu/product/domain/repositories
mkdir -p src/contexts/menu/product/application/create
mkdir -p src/contexts/menu/product/application/update
mkdir -p src/contexts/menu/product/application/delete
mkdir -p src/contexts/menu/product/application/find
mkdir -p src/contexts/menu/product/application/search-by-criteria
mkdir -p src/contexts/menu/product/application/dto
mkdir -p src/contexts/menu/product/infrastructure/persistence/typeorm
mkdir -p src/contexts/menu/product/presentation/http/controllers
mkdir -p src/contexts/menu/product/presentation/http/dto

mkdir -p src/contexts/menu/category/domain
mkdir -p src/contexts/menu/category/domain/events
mkdir -p src/contexts/menu/category/domain/exceptions
mkdir -p src/contexts/menu/category/domain/repositories
mkdir -p src/contexts/menu/category/application/create
mkdir -p src/contexts/menu/category/application/update
mkdir -p src/contexts/menu/category/application/delete
mkdir -p src/contexts/menu/category/application/find
mkdir -p src/contexts/menu/category/application/find-all
mkdir -p src/contexts/menu/category/application/dto
mkdir -p src/contexts/menu/category/infrastructure/persistence/typeorm
mkdir -p src/contexts/menu/category/presentation/http/controllers
mkdir -p src/contexts/menu/category/presentation/http/dto
```

**Beneficios de esta estructura:**
- ✅ Alta cohesión: Todo lo relacionado con Product está junto
- ✅ Equipos independientes: Un equipo por agregado
- ✅ Preparado para microservicios: Fácil extraer product/ a su propio servicio
- ✅ Menos conflicts en git: Cambios en product no afectan category

#### Paso 2.2: Migrar Product Aggregate

**Copiar archivos con nueva estructura:**
```bash
# Domain (agregado completo en product/domain/)
cp src/modules/products/domain/product.ts src/contexts/menu/product/domain/
cp src/modules/products/domain/product-*.ts src/contexts/menu/product/domain/
cp src/modules/products/domain/preparation-time.ts src/contexts/menu/product/domain/
cp src/modules/products/domain/events/*.ts src/contexts/menu/product/domain/events/
cp src/modules/products/domain/exceptions/*.ts src/contexts/menu/product/domain/exceptions/
cp src/modules/products/domain/repositories/product.repository.ts src/contexts/menu/product/domain/repositories/
cp -r src/modules/products/domain/inventory-strategies src/contexts/menu/product/domain/

# Application (cada use case en su carpeta)
cp -r src/modules/products/application/create/* src/contexts/menu/product/application/create/
cp -r src/modules/products/application/update/* src/contexts/menu/product/application/update/
cp -r src/modules/products/application/delete/* src/contexts/menu/product/application/delete/
cp -r src/modules/products/application/find/* src/contexts/menu/product/application/find/
cp -r src/modules/products/application/search-by-criteria/* src/contexts/menu/product/application/search-by-criteria/
cp -r src/modules/products/application/dto/* src/contexts/menu/product/application/dto/

# Infrastructure (persistencia)
cp -r src/modules/products/infrastructure/persistence/typeorm/* src/contexts/menu/product/infrastructure/persistence/typeorm/

# Presentation (controllers y DTOs)
cp src/modules/products/presentation/http/controllers/product.controller.ts src/contexts/menu/product/presentation/http/controllers/
cp -r src/modules/products/presentation/http/dto/* src/contexts/menu/product/presentation/http/dto/
```

**Actualizar imports en archivos copiados:**
```typescript
// Antes
import { Product } from '@/modules/products/domain/product'
import { Unit } from '@/modules/units/domain/unit'
import { ProductRepository } from '@/modules/products/domain/repositories/product.repository'

// Después
import { Product } from '@/contexts/menu/product/domain/product'
import { Unit } from '@/shared-kernel/domain/units/unit'
import { ProductRepository } from '@/contexts/menu/product/domain/repositories/product.repository'
```

**Estructura final de Product:**
```
src/contexts/menu/product/
├── domain/
│   ├── product.ts                           # Aggregate root
│   ├── product-id.ts
│   ├── product-name.ts
│   ├── product-price.ts
│   ├── product-sku.ts
│   ├── product-type.ts
│   ├── product-image.ts
│   ├── preparation-time.ts
│   ├── events/
│   │   ├── product-created.event.ts
│   │   ├── product-updated.event.ts
│   │   ├── product-deleted.event.ts
│   │   └── product-price-changed.event.ts
│   ├── exceptions/
│   │   ├── product-not-exist.exception.ts
│   │   └── product-sku-already-exists.exception.ts
│   ├── repositories/
│   │   └── product.repository.ts
│   └── inventory-strategies/
│       ├── inventory-strategy.ts
│       ├── direct-inventory.ts
│       └── recipe-based-inventory.ts
│
├── application/
│   ├── create/
│   │   ├── create-product.ts                # Use case
│   │   ├── create-product.command.ts
│   │   └── create-product.handler.ts
│   ├── update/
│   │   ├── update-product.ts
│   │   ├── update-product.command.ts
│   │   └── update-product.handler.ts
│   ├── delete/
│   │   ├── delete-product.ts
│   │   ├── delete-product.command.ts
│   │   └── delete-product.handler.ts
│   ├── find/
│   │   ├── find-product.ts
│   │   ├── find-product.query.ts
│   │   └── find-product.handler.ts
│   ├── search-by-criteria/
│   │   ├── search-products-by-criteria.ts
│   │   ├── search-products-by-criteria.query.ts
│   │   └── search-products-by-criteria.handler.ts
│   └── dto/
│       ├── product.response.ts
│       └── paginated-product-list.response.ts
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── product.entity.ts
│           ├── typeorm-product.repository.ts
│           └── recipe-item.entity.ts
│
└── presentation/
    └── http/
        ├── controllers/
        │   └── product.controller.ts
        └── dto/
            ├── create-product.request.ts
            ├── update-product.request.ts
            └── search-products.request.ts
```

**NOTA:** Las clases mantienen sus nombres (`Product`, `ProductId`, `ProductRepository`), solo cambia su ubicación.

#### Paso 2.3: Migrar ProductCategory

**Copiar archivos con estructura por agregados:**
```bash
# Domain
cp src/modules/product-categories/domain/product-category.ts src/contexts/menu/category/domain/
cp src/modules/product-categories/domain/product-category-*.ts src/contexts/menu/category/domain/
cp src/modules/product-categories/domain/events/*.ts src/contexts/menu/category/domain/events/
cp src/modules/product-categories/domain/exceptions/*.ts src/contexts/menu/category/domain/exceptions/
cp src/modules/product-categories/domain/repositories/product-category.repository.ts src/contexts/menu/category/domain/repositories/

# Application
cp -r src/modules/product-categories/application/create/* src/contexts/menu/category/application/create/
cp -r src/modules/product-categories/application/update/* src/contexts/menu/category/application/update/
cp -r src/modules/product-categories/application/delete/* src/contexts/menu/category/application/delete/
cp -r src/modules/product-categories/application/find/* src/contexts/menu/category/application/find/
cp -r src/modules/product-categories/application/find-all/* src/contexts/menu/category/application/find-all/
cp -r src/modules/product-categories/application/dto/* src/contexts/menu/category/application/dto/
cp -r src/modules/product-categories/application/subscribers/* src/contexts/menu/category/application/subscribers/

# Infrastructure
cp -r src/modules/product-categories/infrastructure/persistence/typeorm/* src/contexts/menu/category/infrastructure/persistence/typeorm/

# Presentation
cp src/modules/product-categories/presentation/http/controllers/product-categories.controller.ts src/contexts/menu/category/presentation/http/controllers/
cp -r src/modules/product-categories/presentation/http/dto/* src/contexts/menu/category/presentation/http/dto/
```

**Actualizar imports:**
```typescript
// Antes
import { ProductCategory } from '@/modules/product-categories/domain/product-category'
import { ProductCategoryRepository } from '@/modules/product-categories/domain/repositories/product-category.repository'

// Después
import { ProductCategory } from '@/contexts/menu/category/domain/product-category'
import { ProductCategoryRepository } from '@/contexts/menu/category/domain/repositories/product-category.repository'
```

**Estructura final de Category:**
```
src/contexts/menu/category/
├── domain/
│   ├── product-category.ts
│   ├── product-category-id.ts
│   ├── product-category-name.ts
│   ├── product-category-description.ts
│   ├── product-category-icon.ts
│   ├── product-category-display-order.ts
│   ├── product-category-is-active.ts
│   ├── events/
│   │   └── category-created.event.ts
│   ├── exceptions/
│   │   └── product-category-not-exist.exception.ts
│   └── repositories/
│       └── product-category.repository.ts
│
├── application/
│   ├── create/
│   │   ├── create-product-category.ts
│   │   ├── create-product-category.command.ts
│   │   └── create-product-category.handler.ts
│   ├── update/
│   │   ├── update-product-category.ts
│   │   ├── update-product-category.command.ts
│   │   └── update-product-category.handler.ts
│   ├── delete/
│   │   ├── delete-product-category.ts
│   │   ├── delete-product-category.command.ts
│   │   └── delete-product-category.handler.ts
│   ├── find/
│   │   ├── find-product-category.ts
│   │   ├── find-product-category.query.ts
│   │   └── find-product-category.handler.ts
│   ├── find-all/
│   │   ├── find-all-product-categories.ts
│   │   ├── find-all-product-categories.query.ts
│   │   └── find-all-product-categories.handler.ts
│   ├── dto/
│   │   ├── product-category.response.ts
│   │   └── product-category-list.response.ts
│   └── subscribers/
│       └── react-on-category-created.ts
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── product-category.entity.ts
│           └── typeorm-product-category.repository.ts
│
└── presentation/
    └── http/
        ├── controllers/
        │   └── product-categories.controller.ts
        └── dto/
            ├── create-product-category.request.ts
            └── update-product-category.request.ts
```

#### Paso 2.4: Crear Menu Module

```typescript
// src/contexts/menu/menu.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductEntity } from './infrastructure/persistence/typeorm/product.entity'
import { ProductCategoryEntity } from './infrastructure/persistence/typeorm/product-category.entity'
// ... imports

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductCategoryEntity]),
    SharedKernelModule  // Importar shared kernel
  ],
  providers: [
    // Repositories
    {
      provide: ProductRepository,
      useClass: TypeOrmProductRepository
    },
    // Use Cases
    CreateProduct,
    UpdateProduct,
    UpdateProductPrice,
    // ... etc
  ],
  controllers: [
    ProductController,
    ProductCategoryController
  ],
  exports: [
    ProductRepository  // Si otros contextos lo necesitan
  ]
})
export class MenuModule {}
```

#### Paso 2.5: Actualizar AppModule

```typescript
// src/modules/app.module.ts
import { MenuModule } from '@/contexts/menu/menu.module'

@Module({
  imports: [
    // ... otros imports
    MenuModule,  // ← Nuevo módulo
    // Comentar o remover:
    // ProductsModule,
    // ProductCategoriesModule,
  ]
})
export class AppModule {}
```

#### Paso 2.6: Actualizar imports en otros módulos

**Buscar todos los usos de Product:**
```bash
grep -r "from '@/modules/products" src/
```

**Actualizar cada import:**
```typescript
// Antes
import { ProductId } from '@/modules/products/domain/product-id'

// Después
import { ProductId } from '@/contexts/menu/domain/product/product-id'
```

**Verificación:**
```bash
pnpm tsc --noEmit
pnpm test
pnpm start:dev  # Verificar que corre
```

**Criterio de éxito:**
- ✅ Compilación exitosa
- ✅ Todos los tests pasan
- ✅ API funciona correctamente
- ✅ Menu context independiente
- ✅ Endpoints mantienen `/products` (sin breaking changes)

---

### Fase 3: Migrar Inventory Context (3-4 días)

**Objetivo:** Mover Ingredients, InventoryLevel, InventoryBatch a Inventory Context

#### Paso 3.1: Crear estructura de Inventory

**IMPORTANTE:** Usando **Propuesta 2** (Organización por Agregados)

```bash
# Ingredient aggregate
mkdir -p src/contexts/inventory/ingredient/domain
mkdir -p src/contexts/inventory/ingredient/domain/events
mkdir -p src/contexts/inventory/ingredient/domain/exceptions
mkdir -p src/contexts/inventory/ingredient/domain/repositories
mkdir -p src/contexts/inventory/ingredient/application/create
mkdir -p src/contexts/inventory/ingredient/application/find
mkdir -p src/contexts/inventory/ingredient/application/find-all
mkdir -p src/contexts/inventory/ingredient/application/dto
mkdir -p src/contexts/inventory/ingredient/application/subscribers
mkdir -p src/contexts/inventory/ingredient/infrastructure/persistence/typeorm
mkdir -p src/contexts/inventory/ingredient/presentation/http/controllers
mkdir -p src/contexts/inventory/ingredient/presentation/http/dto

# IngredientCategory (parte de ingredient)
mkdir -p src/contexts/inventory/ingredient-category/domain
mkdir -p src/contexts/inventory/ingredient-category/domain/events
mkdir -p src/contexts/inventory/ingredient-category/domain/exceptions
mkdir -p src/contexts/inventory/ingredient-category/domain/repositories
mkdir -p src/contexts/inventory/ingredient-category/application/create
mkdir -p src/contexts/inventory/ingredient-category/application/find
mkdir -p src/contexts/inventory/ingredient-category/application/find-all
mkdir -p src/contexts/inventory/ingredient-category/application/dto
mkdir -p src/contexts/inventory/ingredient-category/application/subscribers
mkdir -p src/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm
mkdir -p src/contexts/inventory/ingredient-category/presentation/http/controllers
mkdir -p src/contexts/inventory/ingredient-category/presentation/http/dto

# InventoryLevel aggregate (stock)
mkdir -p src/contexts/inventory/stock-level/domain
mkdir -p src/contexts/inventory/stock-level/domain/events
mkdir -p src/contexts/inventory/stock-level/domain/repositories
mkdir -p src/contexts/inventory/stock-level/application/check-stock
mkdir -p src/contexts/inventory/stock-level/application/register-purchase
mkdir -p src/contexts/inventory/stock-level/application/deduct
mkdir -p src/contexts/inventory/stock-level/application/queries
mkdir -p src/contexts/inventory/stock-level/application/subscribers
mkdir -p src/contexts/inventory/stock-level/infrastructure/persistence/typeorm
mkdir -p src/contexts/inventory/stock-level/presentation/http/controllers

# InventoryBatch aggregate
mkdir -p src/contexts/inventory/batch/domain
mkdir -p src/contexts/inventory/batch/domain/repositories
mkdir -p src/contexts/inventory/batch/domain/services
mkdir -p src/contexts/inventory/batch/application
mkdir -p src/contexts/inventory/batch/infrastructure/persistence/typeorm
```

#### Paso 3.2: Refactorizar InventoryMovement

**IMPORTANTE:** Antes de migrar, refactorizar InventoryMovement a Entity.

**Crear archivo nuevo:**
```typescript
// src/contexts/inventory/domain/stock-level/inventory-movement.ts
// ❌ NO extends AggregateRoot
export class InventoryMovement {
  private constructor(
    public readonly id: InventoryMovementId,
    public readonly type: MovementType,
    // ...
  ) {}

  static create(...): InventoryMovement {
    return new InventoryMovement(...)
  }
}
```

**Actualizar InventoryLevel:**
```typescript
// src/contexts/inventory/domain/stock-level/inventory-level.ts
export class InventoryLevel extends AggregateRoot {
  private movements: InventoryMovement[]  // ← Colección de entities

  recordPurchase(...): void {
    const movement = InventoryMovement.create(...)
    this.movements.push(movement)
    this.currentQuantity = this.currentQuantity.add(...)
  }
}
```

#### Paso 3.3: Migrar Ingredient

```bash
# Copiar domain
cp -r src/modules/ingredients/domain/* src/contexts/inventory/domain/ingredient/
cp -r src/modules/ingredient-categories/domain/* src/contexts/inventory/domain/ingredient/

# Actualizar imports
# ...
```

#### Paso 3.4: Migrar Stock Level (InventoryLevel + Movements)

```bash
cp src/modules/inventory/domain/inventory-level.ts src/contexts/inventory/domain/stock-level/
cp src/modules/inventory/domain/inventory-movement.ts src/contexts/inventory/domain/stock-level/
cp src/modules/inventory/domain/movement-type.ts src/contexts/inventory/domain/stock-level/
# ...
```

#### Paso 3.5: Migrar Batch (InventoryBatch)

```bash
cp src/modules/inventory/domain/inventory-batch.ts src/contexts/inventory/domain/batch/
# ...
```

#### Paso 3.6: Crear Inventory Module

```typescript
// src/contexts/inventory/inventory.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      IngredientEntity,
      IngredientCategoryEntity,
      InventoryLevelEntity,
      InventoryMovementEntity,
      InventoryBatchEntity
    ]),
    SharedKernelModule,
    CqrsModule
  ],
  providers: [
    // Repositories
    { provide: IngredientRepository, useClass: TypeOrmIngredientRepository },
    { provide: InventoryLevelRepository, useClass: TypeOrmInventoryLevelRepository },
    { provide: InventoryBatchRepository, useClass: TypeOrmInventoryBatchRepository },

    // Use Cases
    CreateIngredient,
    RegisterPurchase,
    DeductStock,

    // Subscribers
    OnRecipeUsedSubscriber,
    LogStockAlertsSubscriber
  ],
  controllers: [
    IngredientController,
    InventoryLevelController
  ],
  exports: [
    IngredientRepository,
    InventoryLevelRepository
  ]
})
export class InventoryModule {}
```

**Verificación:**
```bash
pnpm tsc --noEmit
pnpm test
```

---

### Fase 4: Migrar Kitchen Context (2-3 días)

**Objetivo:** Mover Recipes y Transformations a Kitchen Context

**IMPORTANTE:** Kitchen usa lenguaje del negocio (cocina de restaurante), no "Production" (industrial)

#### Paso 4.1: Crear estructura de Kitchen

**IMPORTANTE:** Usando **Propuesta 2** (Organización por Agregados)

```bash
# Recipe aggregate
mkdir -p src/contexts/kitchen/recipe/domain
mkdir -p src/contexts/kitchen/recipe/domain/events
mkdir -p src/contexts/kitchen/recipe/domain/exceptions
mkdir -p src/contexts/kitchen/recipe/domain/repositories
mkdir -p src/contexts/kitchen/recipe/application/create
mkdir -p src/contexts/kitchen/recipe/application/update
mkdir -p src/contexts/kitchen/recipe/application/use-recipe
mkdir -p src/contexts/kitchen/recipe/application/dto
mkdir -p src/contexts/kitchen/recipe/application/subscribers
mkdir -p src/contexts/kitchen/recipe/infrastructure/persistence/typeorm
mkdir -p src/contexts/kitchen/recipe/presentation/http/controllers
mkdir -p src/contexts/kitchen/recipe/presentation/http/dto

# Transformation aggregate
mkdir -p src/contexts/kitchen/transformation/domain
mkdir -p src/contexts/kitchen/transformation/domain/events
mkdir -p src/contexts/kitchen/transformation/domain/repositories
mkdir -p src/contexts/kitchen/transformation/application/register
mkdir -p src/contexts/kitchen/transformation/infrastructure/persistence/typeorm
mkdir -p src/contexts/kitchen/transformation/presentation/http/controllers
mkdir -p src/contexts/kitchen/transformation/presentation/http/dto
```

#### Paso 4.2: Extraer Recipe de Products

**IMPORTANTE:** Recipe actualmente está dentro de Products (módulo menu). Debe moverse a Kitchen.

```bash
# Copiar recipe de products
cp -r src/modules/products/domain/recipe/* src/contexts/kitchen/domain/recipe/
```

**Actualizar Product en Menu:**
```typescript
// src/contexts/menu/domain/product/product.ts
export class Product extends AggregateRoot {
  // Mantener solo recipeId, NO el objeto Recipe
  private recipeId: RecipeId | null

  // ❌ Eliminar cualquier lógica de Recipe aquí
}
```

#### Paso 4.3: Migrar Transformations

```bash
cp -r src/modules/ingredient-transformations/domain/* src/contexts/kitchen/domain/transformation/
cp -r src/modules/ingredient-transformations/application/* src/contexts/kitchen/application/transformation/
cp -r src/modules/ingredient-transformations/infrastructure/* src/contexts/kitchen/infrastructure/
```

#### Paso 4.4: Configurar integración con Menu

**Kitchen necesita saber cuando se crea un Product:**

```typescript
// src/contexts/kitchen/application/subscribers/on-product-created.subscriber.ts
@Injectable()
export class OnProductCreatedSubscriber {
  subscribedTo() {
    return [ProductCreated]  // Evento de Menu Context
  }

  async on(event: ProductCreated): Promise<void> {
    if (event.recipeId) {
      // Vincular product con recipe
      const recipe = await this.recipeRepo.findById(event.recipeId)
      // ...
    }
  }
}
```

#### Paso 4.5: Crear Kitchen Module

```typescript
// src/contexts/kitchen/kitchen.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecipeEntity,
      RecipeItemEntity,
      IngredientTransformationEntity,
      PreparationRecipeEntity
    ]),
    SharedKernelModule,
    CqrsModule
  ],
  providers: [
    // Repositories
    { provide: RecipeRepository, useClass: TypeOrmRecipeRepository },
    { provide: TransformationRepository, useClass: TypeOrmTransformationRepository },

    // Use Cases
    CreateRecipe,
    UseRecipe,
    RegisterTransformation,

    // Subscribers
    OnProductCreatedSubscriber
  ],
  controllers: [
    RecipeController,
    TransformationController
  ],
  exports: [
    RecipeRepository
  ]
})
export class KitchenModule {}
```

**Verificación:**
```bash
pnpm tsc --noEmit
pnpm test
```

---

### Fase 5: Configurar Integración entre Contextos (1-2 días)

**Objetivo:** Asegurar que los eventos de dominio fluyen correctamente

#### Paso 5.1: Verificar Event Bus

```typescript
// src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts
// Debe estar configurado globalmente
```

#### Paso 5.2: Eventos entre Catalog → Production

```typescript
// Catalog Context publica
export class CreateProduct {
  async run(...): Promise<void> {
    const product = Product.create(...)
    await this.productRepo.save(product)

    const events = product.pullDomainEvents()
    await this.eventBus.publish(events)
    // → ProductCreated event
  }
}

// Production Context escucha
@Injectable()
export class OnProductCreated implements DomainEventSubscriber<ProductCreated> {
  subscribedTo() { return [ProductCreated] }

  async on(event: ProductCreated): Promise<void> {
    // React to product creation
  }
}
```

#### Paso 5.3: Eventos entre Production → Inventory

```typescript
// Production Context publica
export class UseRecipe {
  async run(recipeId: string): Promise<void> {
    const recipe = await this.recipeRepo.findById(recipeId)

    // Publicar evento
    this.eventBus.publish(new RecipeUsed({
      recipeId: recipe.id.value,
      ingredients: recipe.items.map(...)
    }))
  }
}

// Inventory Context escucha
@Injectable()
export class OnRecipeUsed implements DomainEventSubscriber<RecipeUsed> {
  subscribedTo() { return [RecipeUsed] }

  async on(event: RecipeUsed): Promise<void> {
    for (const ingredient of event.ingredients) {
      await this.deductStock.run(ingredient.ingredientId, ingredient.quantity)
    }
  }
}
```

#### Paso 5.4: Tests de Integración

```typescript
// tests/contexts/integration/catalog-production.integration.spec.ts
describe('Catalog → Production Integration', () => {
  it('should link recipe when product is created', async () => {
    // Given
    const recipeId = 'recipe-123'
    const productId = 'product-456'

    // When
    await createProduct.run(productId, 'Product Name', recipeId)

    // Then
    // Verificar que el subscriber fue llamado
    expect(onProductCreatedSubscriber.on).toHaveBeenCalledWith(
      expect.objectContaining({ recipeId })
    )
  })
})
```

---

### Fase 6: Limpieza (1 día)

**Objetivo:** Eliminar código viejo

#### Paso 6.1: Verificar que todo funciona

```bash
# Tests
pnpm test

# Compilación
pnpm build

# E2E
pnpm test:e2e

# Arrancar aplicación
pnpm start:dev
```

#### Paso 6.2: Eliminar módulos viejos

```bash
# Una vez que todo funciona, eliminar:
rm -rf src/modules/products
rm -rf src/modules/product-categories
rm -rf src/modules/ingredients
rm -rf src/modules/ingredient-categories
rm -rf src/modules/inventory
rm -rf src/modules/units
rm -rf src/modules/unit-conversions
# Mantener solo app.module.ts si es necesario
```

#### Paso 6.3: Limpiar imports y aliases

**Actualizar tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/contexts/*": ["src/contexts/*"],
      "@/shared-kernel/*": ["src/contexts/shared-kernel/*"],
      "@/shared/*": ["src/shared/*"]
      // Eliminar @/modules/*
    }
  }
}
```

#### Paso 6.4: Actualizar documentación

- Actualizar README.md con nueva estructura
- Actualizar CLAUDE.md con referencias a contexts
- Crear README.md en cada context

---

## 📊 Checklist por Fase

### ✅ Fase 1: Preparación
- [ ] Crear carpeta `src/contexts/`
- [ ] Mover Units a Shared Kernel
- [ ] Actualizar path aliases
- [ ] Tests pasan
- [ ] Compilación exitosa

### ✅ Fase 2: Catalog Context
- [ ] Crear estructura de carpetas
- [ ] Migrar Product aggregate
- [ ] Migrar ProductCategory aggregate
- [ ] Crear CatalogModule
- [ ] Actualizar imports en otros módulos
- [ ] Tests pasan
- [ ] API funciona

### ✅ Fase 3: Inventory Context
- [ ] Crear estructura de carpetas
- [ ] Refactorizar InventoryMovement (Entity)
- [ ] Migrar Ingredient aggregate
- [ ] Migrar InventoryLevel aggregate
- [ ] Migrar InventoryBatch aggregate
- [ ] Crear InventoryModule
- [ ] Tests pasan

### ✅ Fase 4: Production Context
- [ ] Crear estructura de carpetas
- [ ] Extraer Recipe de Products
- [ ] Migrar Transformation aggregate
- [ ] Crear ProductionModule
- [ ] Configurar subscribers
- [ ] Tests pasan

### ✅ Fase 5: Integración
- [ ] Verificar Event Bus global
- [ ] Tests de integración Catalog → Production
- [ ] Tests de integración Production → Inventory
- [ ] E2E tests pasan

### ✅ Fase 6: Limpieza
- [ ] Eliminar módulos viejos
- [ ] Limpiar imports
- [ ] Actualizar documentación
- [ ] Deploy a producción

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Imports rotos

**Mitigación:**
- Usar búsqueda global antes de eliminar módulos: `grep -r "from '@/modules/" src/`
- Herramientas de refactoring de IDE
- Compilar frecuentemente

### Riesgo 2: Tests rotos

**Mitigación:**
- Ejecutar tests después de cada paso
- Actualizar Object Mothers gradualmente
- Mantener tests E2E actualizados

### Riesgo 3: Eventos no se disparan

**Mitigación:**
- Tests de integración específicos para eventos
- Logging de eventos en desarrollo
- Verificar subscribers registrados

### Riesgo 4: Dependencias circulares

**Mitigación:**
- Contexts no deben importarse entre sí directamente
- Solo comunicación via eventos
- Shared Kernel para código común

---

## 🎯 Tiempo Estimado Total

| Fase | Duración | Desarrolladores |
|------|----------|----------------|
| 1. Preparación | 1-2 días | 1 dev |
| 2. Catalog | 2-3 días | 1-2 devs |
| 3. Inventory | 3-4 días | 2 devs |
| 4. Production | 2-3 días | 1 dev |
| 5. Integración | 1-2 días | 2 devs |
| 6. Limpieza | 1 día | 1 dev |
| **TOTAL** | **10-15 días** | **1-2 devs** |

---

## 📝 Scripts Útiles

### Script: Buscar todos los imports de un módulo

```bash
#!/bin/bash
# find-imports.sh
MODULE=$1
grep -r "from '@/modules/$MODULE" src/ --include="*.ts"
```

### Script: Actualizar imports automáticamente

```bash
#!/bin/bash
# update-imports.sh
find src/ -type f -name "*.ts" -exec sed -i '' \
  "s|@/modules/products|@/contexts/catalog/domain/product|g" {} +
```

### Script: Verificar compilación y tests

```bash
#!/bin/bash
# verify.sh
echo "🔍 Compiling..."
pnpm tsc --noEmit || exit 1

echo "🧪 Running tests..."
pnpm test || exit 1

echo "✅ All good!"
```

---

---

## 📐 Estructura Final del Sistema

### Vista Completa de Bounded Contexts

```
src/
├── contexts/                                    # Bounded Contexts
│   │
│   ├── shared-kernel/                          # Shared Kernel
│   │   ├── unit/                               # Unit aggregate
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── unit-conversion/                    # UnitConversion aggregate
│   │       ├── domain/
│   │       ├── application/
│   │       └── infrastructure/
│   │
│   ├── menu/                                    # Menu Context
│   │   ├── product/                            # Product aggregate
│   │   │   ├── domain/
│   │   │   │   ├── product.ts
│   │   │   │   ├── product-*.ts
│   │   │   │   ├── events/
│   │   │   │   ├── exceptions/
│   │   │   │   └── repositories/
│   │   │   ├── application/
│   │   │   │   ├── create/
│   │   │   │   ├── update/
│   │   │   │   ├── delete/
│   │   │   │   ├── find/
│   │   │   │   ├── search-by-criteria/
│   │   │   │   └── dto/
│   │   │   ├── infrastructure/
│   │   │   │   └── persistence/typeorm/
│   │   │   └── presentation/
│   │   │       └── http/
│   │   └── category/                           # ProductCategory aggregate
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       └── presentation/
│   │
│   ├── inventory/                               # Inventory Context
│   │   ├── ingredient/                         # Ingredient aggregate
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── ingredient-category/                # IngredientCategory aggregate
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── stock-level/                        # InventoryLevel aggregate
│   │   │   ├── domain/
│   │   │   │   ├── inventory-level.ts
│   │   │   │   ├── inventory-movement.ts       # Entity (not aggregate!)
│   │   │   │   ├── events/
│   │   │   │   └── repositories/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── batch/                              # InventoryBatch aggregate
│   │       ├── domain/
│   │       ├── application/
│   │       └── infrastructure/
│   │
│   └── kitchen/                                 # Kitchen Context
│       ├── recipe/                             # Recipe aggregate
│       │   ├── domain/
│       │   │   ├── recipe.ts
│       │   │   ├── recipe-item.ts
│       │   │   ├── events/
│       │   │   └── repositories/
│       │   ├── application/
│       │   │   ├── create/
│       │   │   ├── update/
│       │   │   ├── use-recipe/
│       │   │   ├── dto/
│       │   │   └── subscribers/
│       │   ├── infrastructure/
│       │   └── presentation/
│       └── transformation/                     # IngredientTransformation aggregate
│           ├── domain/
│           ├── application/
│           ├── infrastructure/
│           └── presentation/
│
├── shared/                                      # Shared Infrastructure (NOT domain)
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── value-objects/                      # Generic VOs (Uuid, Money, etc.)
│   │   ├── events/                             # Event bus interfaces
│   │   └── exceptions/
│   ├── application/
│   │   └── bus/                                # Command/Query bus
│   └── infrastructure/
│       ├── cqrs/                               # CQRS adapters
│       ├── event-bus/                          # Event bus impl
│       ├── event-sourcing/                     # Event store
│       └── database/                           # DB config
│
└── modules/                                     # Legacy (to be deleted)
    └── app.module.ts
```

### Relaciones entre Contextos (Context Map)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shared Kernel                             │
│  Unit, UnitConversion, Quantity, Money                          │
└─────────────────────────────────────────────────────────────────┘
                              ↑   ↑   ↑
                              │   │   │
                    ┌─────────┘   │   └──────────┐
                    │             │              │
    ┌───────────────▼────┐   ┌────▼─────────┐   ┌▼───────────────┐
    │   Menu Context     │   │  Inventory   │   │   Kitchen      │
    │                    │   │   Context    │   │   Context      │
    │  - Product         │   │              │   │                │
    │  - Category        │   │ - Ingredient │   │ - Recipe       │
    │                    │   │ - Stock      │   │ - Transform    │
    └──────┬─────────────┘   │ - Batch      │   └──────▲─────────┘
           │                 └──────▲───────┘          │
           │                        │                  │
           │   ProductCreated       │  RecipeUsed      │
           └────────────────────────┴──────────────────┘
                      (Domain Events)
```

**Comunicación entre contextos:**
- **Menu → Kitchen**: `ProductCreated` event (cuando se asocia receta)
- **Kitchen → Inventory**: `RecipeUsed` event (deducir ingredientes)
- **Inventory → Kitchen**: `LowStockDetected` event (alertas de stock bajo)

---

## 🚀 Siguiente Acción

**¿Comenzamos con la Fase 1 (Preparación)?**

Pasos inmediatos:
1. Crear carpeta `src/contexts/`
2. Mover Units a Shared Kernel
3. Actualizar tsconfig.json
4. Verificar que compila

✅ **Plan listo** con estructura por agregados (Propuesta 2)
📄 **Documentación:** Ver [STRUCTURE-COMPARISON-ANALYSIS.md](./STRUCTURE-COMPARISON-ANALYSIS.md) para más detalles

¿Procedo con estos cambios?
