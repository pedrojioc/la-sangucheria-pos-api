# 🔴 Compilation Errors Report

**Generated:** 2025-11-04
**Project:** La Sanguchería POS
**Command:** `pnpm tsc --noEmit`

---

## 📋 Resumen de Archivos con Errores

### **1. Value Objects - Falta tipo genérico (`ValueObject<T>`)**

**Descripción:** Archivos que extienden `ValueObject` sin especificar el tipo genérico `<T>`.

- [src/modules/ingredient-transformations/domain/preparation-recipe-ingredient.ts:16](src/modules/ingredient-transformations/domain/preparation-recipe-ingredient.ts#L16)
- [src/modules/ingredient-transformations/domain/yield-percentage.ts:11](src/modules/ingredient-transformations/domain/yield-percentage.ts#L11)
- [src/modules/products/domain/recipe/recipe-item.ts:5](src/modules/products/domain/recipe/recipe-item.ts#L5)
- [src/modules/products/domain/recipe/recipe-item.ts:21](src/modules/products/domain/recipe/recipe-item.ts#L21)
- [src/modules/products/domain/recipe/recipe-yield.ts:4](src/modules/products/domain/recipe/recipe-yield.ts#L4)
- [src/modules/products/domain/recipe/recipe-yield.ts:17](src/modules/products/domain/recipe/recipe-yield.ts#L17)
- [src/modules/unit-conversions/domain/conversion-factor.ts:15](src/modules/unit-conversions/domain/conversion-factor.ts#L15)
- [src/shared/domain/value-objects/quantity.ts:3](src/shared/domain/value-objects/quantity.ts#L3)

**Solución esperada:**

```typescript
// ❌ Incorrecto
export class ProductName extends ValueObject {
  // ...
}

// ✅ Correcto
export class ProductName extends ValueObject<string> {
  // ...
}
```

---

### **2. Módulos - Falta import `createProvider`**

**Descripción:** Módulos que intentan usar `createProvider` pero el import no existe en la ruta correcta.

- [src/modules/ingredient-transformations/ingredient-transformations.module.ts:29](src/modules/ingredient-transformations/ingredient-transformations.module.ts#L29)
- [src/modules/inventory/inventory.module.ts:45](src/modules/inventory/inventory.module.ts#L45)
- [src/modules/unit-conversions/unit-conversions.module.ts:22](src/modules/unit-conversions/unit-conversions.module.ts#L22)

**Error:**

```
error TS2307: Cannot find module '@/core/utils/create-use-case-provider'
```

**Ruta correcta:**

```typescript
// ❌ Incorrecto
import { createProvider } from '@/core/utils/create-use-case-provider'

// ✅ Correcto
import { createProvider } from '@/core/utils/createProvider'
```

---

### **3. Use Cases - Falta método `run()` (usan `execute()` o `create()`)**

**Descripción:** Handlers que intentan llamar métodos incorrectos en use cases. Según CLAUDE.md, los use cases deben tener método `run()`, no `execute()` ni `create()`.

#### Handlers con llamadas incorrectas:

- [src/modules/ingredients/application/create/create-ingredient.handler.ts:33](src/modules/ingredients/application/create/create-ingredient.handler.ts#L33)
- [src/modules/ingredients/application/create/create-ingredient.ts:28](src/modules/ingredients/application/create/create-ingredient.ts#L28)
- [src/modules/ingredients/application/find-all/find-all-ingredient.handler.ts:19](src/modules/ingredients/application/find-all/find-all-ingredient.handler.ts#L19)
- [src/modules/ingredients/application/find/find-ingredient.handler.ts:19](src/modules/ingredients/application/find/find-ingredient.handler.ts#L19)
- [src/modules/product-categories/application/create/create-product-category.handler.ts:18](src/modules/product-categories/application/create/create-product-category.handler.ts#L18)
- [src/modules/product-categories/application/find/find-product-category.handler.ts:19](src/modules/product-categories/application/find/find-product-category.handler.ts#L19)
- [src/modules/products/application/create/create-product.handler.ts:19](src/modules/products/application/create/create-product.handler.ts#L19)
- [src/modules/products/application/delete/delete-product.handler.ts:10](src/modules/products/application/delete/delete-product.handler.ts#L10)
- [src/modules/products/application/find/find-product.handler.ts:11](src/modules/products/application/find/find-product.handler.ts#L11)
- [src/modules/products/application/update/update-product.handler.ts:19](src/modules/products/application/update/update-product.handler.ts#L19)

**Error típico:**

```
error TS2339: Property 'create' does not exist on type 'CreateProduct'.
error TS2339: Property 'execute' does not exist on type 'FindProduct'.
```

**Solución esperada:**

```typescript
// ❌ Incorrecto
async execute(command: CreateProductCommand): Promise<void> {
  return this.useCase.create(command.id, command.name)
}

// ✅ Correcto
async execute(command: CreateProductCommand): Promise<void> {
  return this.useCase.run(command.id, command.name)
}
```

---

### **4. Domain Entities - Métodos estáticos incorrectos**

**Descripción:** Entidades de dominio que no tienen los métodos estáticos correctos (`create()`, `fromPrimitives()`).

- [src/modules/inventory/application/deduct-ingredient/deduct-ingredient.ts:65](src/modules/inventory/application/deduct-ingredient/deduct-ingredient.ts#L65) - Llama `InventoryMovement.run()`
- [src/modules/inventory/application/register-purchase/register-purchase.ts:43](src/modules/inventory/application/register-purchase/register-purchase.ts#L43) - Llama `InventoryBatch.run()`
- [src/modules/inventory/application/register-purchase/register-purchase.ts:60](src/modules/inventory/application/register-purchase/register-purchase.ts#L60) - Llama `InventoryMovement.run()`
- [src/modules/inventory/application/register-purchase/register-purchase.ts:84](src/modules/inventory/application/register-purchase/register-purchase.ts#L84) - Llama `InventoryLevel.run()`
- [src/modules/unit-conversions/infrastructure/seed-common-conversions.ts:143](src/modules/unit-conversions/infrastructure/seed-common-conversions.ts#L143) - Llama `UnitConversion.run()`

**Error típico:**

```
error TS2339: Property 'run' does not exist on type 'typeof InventoryBatch'.
```

**Solución esperada:**

```typescript
// ❌ Incorrecto
const batch = InventoryBatch.run(...)

// ✅ Correcto
const batch = InventoryBatch.create(...)
// o
const batch = InventoryBatch.fromPrimitives(...)
```

---

### **5. Reserved Word Issue**

**Descripción:** Uso de palabra reservada de JavaScript como nombre de propiedad.

- [src/modules/products/domain/recipe/recipe.ts:25](src/modules/products/domain/recipe/recipe.ts#L25)

**Error:**

```
error TS1213: Identifier expected. 'yield' is a reserved word in strict mode.
```

**Solución esperada:**

```typescript
// ❌ Incorrecto
export class Recipe {
  private yield: RecipeYield
}

// ✅ Correcto
export class Recipe {
  private recipeYield: RecipeYield
  // o
  private yieldAmount: RecipeYield
}
```

---

### **6. Shared Value Objects - Exports faltantes**

**Descripción:** El archivo index.ts intenta exportar clases que no existen en los módulos correspondientes.

- [src/shared/domain/value-objects/index.ts:8](src/shared/domain/value-objects/index.ts#L8) - `EmailValueObject` no existe
- [src/shared/domain/value-objects/index.ts:9](src/shared/domain/value-objects/index.ts#L9) - `PhoneValueObject` no existe
- [src/shared/domain/value-objects/index.ts:10](src/shared/domain/value-objects/index.ts#L10) - `CreatedAt` no es un módulo

**Errores:**

```
error TS2305: Module '"./email"' has no exported member 'EmailValueObject'.
error TS2305: Module '"./phone"' has no exported member 'PhoneValueObject'.
error TS2306: File '.../created-at.ts' is not a module.
```

**Solución esperada:**

- Verificar los nombres correctos de las clases exportadas
- O crear las clases faltantes
- O remover los exports incorrectos

---

### **7. Domain Events - Estructura incorrecta**

**Descripción:** Eventos de dominio que no siguen la estructura correcta según el refactor documentado en `DOMAIN-EVENTS-REFACTOR-PLAN.md`.

#### Archivos con errores:

**Event Store:**

- [src/shared/infrastructure/event-sourcing/event-store.service.ts](src/shared/infrastructure/event-sourcing/event-store.service.ts)
- [src/shared/infrastructure/event-sourcing/persistence/event-store.entity.ts](src/shared/infrastructure/event-sourcing/persistence/event-store.entity.ts)
- [src/shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts](src/shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts)

**Module Events:**

- [src/modules/ingredient-categories/domain/events/ingredient-category-created.event.ts](src/modules/ingredient-categories/domain/events/ingredient-category-created.event.ts)
- [src/modules/ingredients/domain/events/ingredient-created.event.ts](src/modules/ingredients/domain/events/ingredient-created.event.ts)
- [src/modules/inventory/domain/events/low-stock-detected.event.ts](src/modules/inventory/domain/events/low-stock-detected.event.ts)
- [src/modules/inventory/domain/events/out-of-stock.event.ts](src/modules/inventory/domain/events/out-of-stock.event.ts)
- [src/modules/ingredient-transformations/domain/events/abnormal-waste-detected.event.ts](src/modules/ingredient-transformations/domain/events/abnormal-waste-detected.event.ts)
- [src/modules/ingredient-transformations/domain/events/ingredient-transformed.event.ts](src/modules/ingredient-transformations/domain/events/ingredient-transformed.event.ts)
- [src/modules/product-categories/domain/events/category-created.event.ts](src/modules/product-categories/domain/events/category-created.event.ts)
- [src/modules/products/domain/events/product-created.event.ts](src/modules/products/domain/events/product-created.event.ts)
- [src/modules/products/domain/events/product-deleted.event.ts](src/modules/products/domain/events/product-deleted.event.ts)
- [src/modules/products/domain/events/product-price-changed.event.ts](src/modules/products/domain/events/product-price-changed.event.ts)
- [src/modules/products/domain/events/product-updated.event.ts](src/modules/products/domain/events/product-updated.event.ts)
- [src/modules/units/domain/events/unit-created.event.ts](src/modules/units/domain/events/unit-created.event.ts)
- [src/modules/units/domain/events/unit-deleted.event.ts](src/modules/units/domain/events/unit-deleted.event.ts)
- [src/modules/units/domain/events/unit-updated.event.ts](src/modules/units/domain/events/unit-updated.event.ts)

**Errores típicos:**

```
error TS2339: Property 'payload' does not exist on type 'DomainEvent'
error TS2339: Property 'version' does not exist on type 'DomainEvent'
error TS2345: Argument of type '...' is not assignable to parameter of type 'DomainEventFromPrimitivesParams'
```

---

### **8. Tests - Errores derivados de los cambios**

**Descripción:** Tests que usan métodos incorrectos debido a los cambios en use cases y domain events.

#### Tests de Use Cases (usan `execute()` en vez de `run()`):

- [tests/modules/units/application/CreateUnit.spec.ts:35](tests/modules/units/application/CreateUnit.spec.ts#L35)
- [tests/modules/units/application/CreateUnit.spec.ts:53](tests/modules/units/application/CreateUnit.spec.ts#L53)
- [tests/modules/units/application/DeleteUnit.spec.ts:32](tests/modules/units/application/DeleteUnit.spec.ts#L32)
- [tests/modules/units/application/DeleteUnit.spec.ts:42](tests/modules/units/application/DeleteUnit.spec.ts#L42)
- [tests/modules/units/application/DeleteUnit.spec.ts:56](tests/modules/units/application/DeleteUnit.spec.ts#L56)
- [tests/modules/units/application/FindUnit.spec.ts:26](tests/modules/units/application/FindUnit.spec.ts#L26)
- [tests/modules/units/application/FindUnit.spec.ts:39](tests/modules/units/application/FindUnit.spec.ts#L39)
- [tests/modules/units/application/UpdateUnit.spec.ts:38](tests/modules/units/application/UpdateUnit.spec.ts#L38)
- [tests/modules/units/application/UpdateUnit.spec.ts:57](tests/modules/units/application/UpdateUnit.spec.ts#L57)
- [tests/modules/units/application/UpdateUnit.spec.ts:72](tests/modules/units/application/UpdateUnit.spec.ts#L72)

#### Tests de Domain Events:

- [tests/modules/units/domain/Unit.spec.ts:43-45](tests/modules/units/domain/Unit.spec.ts#L43) - Acceso a propiedades inexistentes
- [tests/modules/units/domain/Unit.spec.ts:81-83](tests/modules/units/domain/Unit.spec.ts#L81)
- [tests/modules/units/domain/Unit.spec.ts:100](tests/modules/units/domain/Unit.spec.ts#L100)
- [tests/modules/products/domain/events/product-price-changed.event.spec.ts:163](tests/modules/products/domain/events/product-price-changed.event.spec.ts#L163)
- [tests/modules/products/domain/events/product-price-changed.event.spec.ts:203](tests/modules/products/domain/events/product-price-changed.event.spec.ts#L203)
- [tests/modules/products/domain/events/product-price-changed.event.spec.ts:247](tests/modules/products/domain/events/product-price-changed.event.spec.ts#L247)

#### Tests de Inventory:

- [tests/modules/inventory/**mothers**/InventoryBatchMother.ts](tests/modules/inventory/__mothers__/InventoryBatchMother.ts) - Propiedades faltantes
- [tests/modules/inventory/**mothers**/InventoryLevelMother.ts](tests/modules/inventory/__mothers__/InventoryLevelMother.ts)
- [tests/modules/inventory/**mothers**/InventoryMovementMother.ts](tests/modules/inventory/__mothers__/InventoryMovementMother.ts)
- [tests/modules/inventory/domain/InventoryBatch.spec.ts](tests/modules/inventory/domain/InventoryBatch.spec.ts)
- [tests/modules/inventory/infrastructure/TypeOrmInventoryBatchRepository.spec.ts](tests/modules/inventory/infrastructure/TypeOrmInventoryBatchRepository.spec.ts)

---

## 🔢 Estadísticas

| Categoría                 | Archivos Afectados | Prioridad     |
| ------------------------- | ------------------ | ------------- |
| Value Objects (genéricos) | 8                  | 🔴 Alta       |
| Módulos (imports)         | 3                  | 🔴 Alta       |
| Use Cases (métodos)       | 10+                | 🔴 Alta       |
| Domain Entities (métodos) | 5                  | 🟡 Media      |
| Reserved Word             | 1                  | 🔴 Alta       |
| Shared Exports            | 3                  | 🔴 Alta       |
| Domain Events             | 15+                | 🟠 Alta-Media |
| Tests                     | 20+                | 🟢 Baja       |

**Total de errores de compilación:** ~100+
**Archivos únicos con errores:** ~40

---

## 🎯 Plan de Corrección Sugerido

### Fase 1: Fundaciones (Alta Prioridad)

1. ✅ Corregir exports en `shared/domain/value-objects/index.ts`
2. ✅ Arreglar tipos genéricos en Value Objects
3. ✅ Corregir import de `createProvider` en módulos
4. ✅ Renombrar propiedad `yield` en Recipe

### Fase 2: Use Cases y Domain (Alta-Media Prioridad)

5. ✅ Cambiar llamadas de `execute()`/`create()` a `run()` en handlers
6. ✅ Corregir métodos estáticos en entidades de dominio (`run()` → `create()`)
7. ✅ Refactorizar Domain Events según DOMAIN-EVENTS-REFACTOR-PLAN.md

### Fase 3: Tests (Baja Prioridad)

8. ✅ Actualizar tests de use cases (usar `run()`)
9. ✅ Actualizar tests de domain events
10. ✅ Actualizar Object Mothers

---

## 📝 Notas

- La mayoría de errores están relacionados con inconsistencias en la aplicación de las convenciones de CLAUDE.md
- El refactor de Domain Events está en progreso según `DOMAIN-EVENTS-REFACTOR-PLAN.md`
- Los tests fallarán hasta que se corrijan los errores de implementación

---

**Siguiente paso:** ¿Comenzar con la Fase 1 (Fundaciones)?
