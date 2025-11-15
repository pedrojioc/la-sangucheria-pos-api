# 🎯 Bounded Context vs Module: Análisis para POS

**Fecha:** 2025-11-04
**Contexto:** Organización del código - ¿Módulos o Bounded Contexts?
**Pregunta:** ¿Cómo organizar Inventory si fuera por Bounded Context en lugar de módulos?

---

## 📚 Conceptos Fundamentales

### 1. **Bounded Context (Contexto Delimitado)**

**Definición (Eric Evans):**
> Un Bounded Context es una **frontera conceptual** dentro de la cual un modelo de dominio particular es definido y aplicable.

**Características:**
- ✅ Define el **límite del modelo de dominio**
- ✅ Tiene su propio **lenguaje ubicuo** (Ubiquitous Language)
- ✅ Los conceptos **pueden significar cosas diferentes** en otros contextos
- ✅ Es una **frontera de autonomía** (equipos, deployments, bases de datos)
- ✅ Puede contener **múltiples agregados**

**Analogía:**
Un Bounded Context es como un **país**:
- Tiene sus propias leyes (reglas de negocio)
- Habla su propio idioma (lenguaje ubicuo)
- Tiene fronteras claras
- Puede tener múltiples ciudades (agregados) dentro

---

### 2. **Module (Módulo)**

**Definición:**
> Un Module es una **unidad de organización de código** dentro de un Bounded Context.

**Características:**
- ✅ Organiza código por **cohesión técnica**
- ✅ Agrupa **conceptos relacionados**
- ✅ Es una **carpeta/namespace** dentro del contexto
- ✅ Facilita la **navegación del código**
- ❌ NO es una frontera de modelo de dominio

**Analogía:**
Un Module es como un **barrio dentro de una ciudad**:
- Agrupa casas similares
- Es solo organización interna
- No tiene leyes propias

---

## 🆚 Comparación: Context vs Module

| Aspecto | Bounded Context | Module |
|---------|----------------|--------|
| **Nivel** | Estratégico (DDD Estratégico) | Táctico (Organización) |
| **Frontera** | Modelo de dominio | Organización de código |
| **Lenguaje** | Lenguaje ubicuo propio | Mismo lenguaje del contexto |
| **Base de Datos** | Puede ser separada | Comparte con el contexto |
| **Equipos** | Puede ser equipo separado | Mismo equipo del contexto |
| **Deploy** | Puede ser microservicio | Parte del mismo deploy |
| **Tamaño** | Grande (múltiples agregados) | Pequeño (1-3 agregados) |
| **Ejemplo** | `Sales`, `Inventory`, `Billing` | `products/`, `orders/` dentro de `Sales` |

---

## 🏢 Bounded Contexts en un POS (Sistema Real)

### Contextos Estratégicos (Alto Nivel)

```
┌─────────────────────────────────────────────────────────────┐
│                    POS SYSTEM                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   SALES      │  │  INVENTORY   │  │   KITCHEN    │     │
│  │   CONTEXT    │  │   CONTEXT    │  │   CONTEXT    │     │
│  │              │  │              │  │              │     │
│  │ - Orders     │  │ - Stock      │  │ - Recipes    │     │
│  │ - Payments   │  │ - Purchases  │  │ - Queue      │     │
│  │ - Customers  │  │ - Suppliers  │  │ - Prep       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   CATALOG    │  │   PRICING    │  │    STAFF     │     │
│  │   CONTEXT    │  │   CONTEXT    │  │   CONTEXT    │     │
│  │              │  │              │  │              │     │
│  │ - Products   │  │ - Prices     │  │ - Employees  │     │
│  │ - Categories │  │ - Promotions │  │ - Schedules  │     │
│  │ - Menu       │  │ - Discounts  │  │ - Shifts     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Análisis: ¿Qué es "Inventory" en tu Proyecto?

### Situación Actual (Organización por "Módulos")

```
src/modules/
├── products/              ← ¿Bounded Context? ¿Module?
├── product-categories/    ← ¿Bounded Context? ¿Module?
├── ingredients/           ← ¿Bounded Context? ¿Module?
├── ingredient-categories/ ← ¿Bounded Context? ¿Module?
├── inventory/             ← ¿Bounded Context? ¿Module?
├── units/                 ← ¿Bounded Context? ¿Module?
└── unit-conversions/      ← ¿Bounded Context? ¿Module?
```

**Problema:** Estás mezclando conceptos de diferentes niveles.

---

## 🎯 Identificando Bounded Contexts Reales

### Test: ¿Es un Bounded Context?

Para cada "módulo", pregunta:

#### 1. **¿Tiene su propio lenguaje ubicuo?**

**Products:**
- Lenguaje: Product, SKU, Price, Category, Menu
- ¿Es diferente en otro contexto? 🤔

**Inventory:**
- Lenguaje: Stock, Batch, FIFO, Movement, Level
- ¿Es diferente en otro contexto? ✅ SÍ

**Conclusión:** Inventory podría ser un Bounded Context.

---

#### 2. **¿Los conceptos significan cosas diferentes en otros contextos?**

**Ejemplo: "Product"**

En **Catalog Context:**
```typescript
class Product {
  name: string
  description: string
  image: string
  categoryId: string
  // Enfocado en PRESENTACIÓN
}
```

En **Inventory Context:**
```typescript
class InventoryItem {  // ← Diferente nombre!
  ingredientId: string
  stockLevel: number
  reorderPoint: number
  // Enfocado en CANTIDADES
}
```

En **Pricing Context:**
```typescript
class PricedProduct {
  productId: string
  basePrice: Money
  promotionalPrice: Money
  // Enfocado en PRECIOS
}
```

**Conclusión:** Si "Product" significa cosas diferentes = Bounded Contexts separados.

---

#### 3. **¿Podrían ser manejados por equipos diferentes?**

- ¿Team Inventory trabaja independiente de Team Sales? ✅ SÍ
- ¿Team Products puede deployar sin Inventory? ✅ SÍ

**Conclusión:** Sí, pueden ser contextos separados.

---

#### 4. **¿Tienen bases de datos/esquemas separados?**

- ¿Inventory tiene sus propias tablas? ✅ SÍ (`inventory_levels`, `inventory_batches`)
- ¿Se comunican vía eventos/APIs? ✅ Podrían

**Conclusión:** Candidatos a contextos separados.

---

## 🏗️ Propuesta: Bounded Contexts para Tu POS

### Opción 1: Contextos Grandes (Approach Conservador)

```
src/contexts/
│
├── catalog/                        ← CATALOG BOUNDED CONTEXT
│   ├── products/                   ← Module dentro del contexto
│   │   ├── domain/
│   │   │   ├── product.ts
│   │   │   ├── product-sku.ts
│   │   │   └── repositories/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── categories/                 ← Module dentro del contexto
│   │   ├── domain/
│   │   ├── application/
│   │   └── ...
│   │
│   └── shared/                     ← Shared kernel del contexto
│       └── value-objects/
│
├── inventory/                      ← INVENTORY BOUNDED CONTEXT
│   ├── stock-management/           ← Module: Gestión de niveles
│   │   ├── domain/
│   │   │   ├── inventory-level.ts
│   │   │   ├── inventory-batch.ts
│   │   │   └── repositories/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── ingredients/                ← Module: Ingredientes
│   │   ├── domain/
│   │   │   ├── ingredient.ts
│   │   │   └── repositories/
│   │   ├── application/
│   │   └── ...
│   │
│   ├── units/                      ← Module: Unidades de medida
│   │   ├── domain/
│   │   └── ...
│   │
│   └── shared/                     ← Shared kernel del contexto
│       └── value-objects/
│           └── quantity.ts
│
├── sales/                          ← SALES BOUNDED CONTEXT
│   ├── orders/
│   ├── payments/
│   └── customers/
│
├── kitchen/                        ← KITCHEN BOUNDED CONTEXT
│   ├── recipes/
│   ├── preparation/
│   └── queue/
│
└── shared-kernel/                  ← SHARED KERNEL (entre contextos)
    ├── domain/
    │   └── value-objects/
    │       ├── money.ts
    │       ├── uuid.ts
    │       └── created-at.ts
    └── infrastructure/
        └── event-bus/
```

---

### Opción 2: Contextos Más Granulares (Approach CodelyTV)

CodelyTV tiende a crear **contextos más pequeños y cohesivos**:

```
src/contexts/
│
├── product-catalog/                ← Contexto: Catálogo de productos
│   ├── domain/
│   │   ├── product.ts
│   │   ├── product-category.ts
│   │   └── repositories/
│   ├── application/
│   └── infrastructure/
│
├── inventory-management/           ← Contexto: Gestión de inventario
│   ├── domain/
│   │   ├── inventory-level.ts      ← Aggregate
│   │   ├── inventory-batch.ts      ← Aggregate
│   │   ├── inventory-movement.ts   ← Entity
│   │   └── repositories/
│   ├── application/
│   └── infrastructure/
│
├── ingredient-catalog/             ← Contexto: Catálogo de ingredientes
│   ├── domain/
│   │   ├── ingredient.ts
│   │   ├── ingredient-category.ts
│   │   └── repositories/
│   ├── application/
│   └── infrastructure/
│
├── measurement-units/              ← Contexto: Unidades de medida
│   ├── domain/
│   │   ├── unit.ts
│   │   ├── unit-conversion.ts
│   │   └── repositories/
│   ├── application/
│   └── infrastructure/
│
├── recipe-management/              ← Contexto: Gestión de recetas
│   ├── domain/
│   │   ├── recipe.ts
│   │   ├── recipe-item.ts
│   │   └── repositories/
│   ├── application/
│   └── infrastructure/
│
└── shared/                         ← Shared kernel
    └── domain/
        └── value-objects/
```

**Ventajas:**
- ✅ Contextos más pequeños y enfocados
- ✅ Cada contexto tiene responsabilidad única
- ✅ Más fácil de escalar (microservicios futuros)

**Desventajas:**
- ❌ Más contextos = más complejidad
- ❌ Más integración entre contextos

---

## 🎨 Ejemplo Concreto: Inventory Bounded Context

### Estructura Completa por Bounded Context

```
src/contexts/inventory/
│
├── README.md                       ← Documentación del contexto
├── UBIQUITOUS-LANGUAGE.md         ← Glosario de términos
│
├── domain/                         ← Dominio del contexto
│   │
│   ├── inventory-level/            ← Subdomain: Niveles de stock
│   │   ├── inventory-level.ts              (Aggregate Root)
│   │   ├── inventory-level-id.ts
│   │   ├── inventory-movement.ts           (Entity)
│   │   ├── movement-type.ts                (Value Object)
│   │   ├── events/
│   │   │   ├── low-stock-detected.event.ts
│   │   │   └── out-of-stock.event.ts
│   │   ├── exceptions/
│   │   │   └── insufficient-stock.exception.ts
│   │   └── repositories/
│   │       └── inventory-level.repository.ts
│   │
│   ├── inventory-batch/            ← Subdomain: Lotes (FIFO)
│   │   ├── inventory-batch.ts              (Aggregate Root)
│   │   ├── inventory-batch-id.ts
│   │   ├── events/
│   │   │   └── batch-exhausted.event.ts
│   │   └── repositories/
│   │       └── inventory-batch.repository.ts
│   │
│   ├── services/                   ← Domain Services
│   │   └── fifo-inventory.service.ts
│   │
│   └── shared/                     ← Shared dentro del contexto
│       └── value-objects/
│           ├── quantity.ts
│           └── stock-threshold.ts
│
├── application/                    ← Casos de uso
│   │
│   ├── stock-level/
│   │   ├── register-purchase/
│   │   │   ├── register-purchase.ts
│   │   │   ├── register-purchase.command.ts
│   │   │   └── register-purchase.handler.ts
│   │   │
│   │   ├── deduct-stock/
│   │   │   ├── deduct-stock.ts
│   │   │   ├── deduct-stock.command.ts
│   │   │   └── deduct-stock.handler.ts
│   │   │
│   │   └── queries/
│   │       ├── get-inventory-levels/
│   │       └── get-low-stock-items/
│   │
│   ├── batch-management/
│   │   └── ...
│   │
│   └── subscribers/                ← Event subscribers
│       └── log-stock-alerts.subscriber.ts
│
├── infrastructure/                 ← Infraestructura
│   │
│   ├── persistence/
│   │   └── typeorm/
│   │       ├── inventory-level.entity.ts
│   │       ├── inventory-movement.entity.ts
│   │       ├── inventory-batch.entity.ts
│   │       ├── typeorm-inventory-level.repository.ts
│   │       └── typeorm-inventory-batch.repository.ts
│   │
│   └── messaging/                  ← Integración con otros contextos
│       ├── events/
│       │   ├── product-sold.handler.ts         (de Sales Context)
│       │   └── ingredient-used.handler.ts      (de Kitchen Context)
│       │
│       └── commands/
│           └── check-stock-availability.handler.ts
│
├── presentation/                   ← API/UI del contexto
│   │
│   └── http/
│       ├── controllers/
│       │   ├── inventory-level.controller.ts
│       │   └── inventory-batch.controller.ts
│       │
│       └── dto/
│           ├── register-purchase.request.ts
│           └── inventory-level.response.ts
│
└── inventory.module.ts             ← NestJS module del contexto
```

---

## 🔗 Integración entre Bounded Contexts

### Context Map (Mapa de Contextos)

```
┌─────────────────┐
│  SALES CONTEXT  │
│                 │
│  - Order        │
│  - OrderItem    │
└────────┬────────┘
         │
         │ Domain Event
         │ OrderCreated
         │
         ▼
┌─────────────────────────┐
│  INVENTORY CONTEXT      │
│                         │
│  Subscriber:            │
│  OnOrderCreated         │
│    → DeductStock        │
│                         │
│  - InventoryLevel       │
│  - InventoryBatch       │
└────────┬────────────────┘
         │
         │ Domain Event
         │ LowStockDetected
         │
         ▼
┌─────────────────────┐
│  PURCHASING CONTEXT │
│                     │
│  Subscriber:        │
│  OnLowStockDetected │
│    → CreatePO       │
│                     │
│  - PurchaseOrder    │
└─────────────────────┘
```

---

## 📊 Comparación: Módulos vs Bounded Contexts

### Tu Estructura Actual (Por "Módulos")

```
src/modules/
├── inventory/          ← ¿Es un contexto completo?
├── ingredients/        ← ¿Parte de Inventory?
├── products/           ← ¿Parte de Catalog?
└── units/              ← ¿Shared kernel?
```

**Problemas:**
- ❌ No está claro qué es un contexto
- ❌ Dependencias cruzadas entre "módulos"
- ❌ No hay lenguaje ubicuo por contexto
- ❌ Difícil escalar a microservicios

---

### Estructura por Bounded Contexts (Propuesta)

```
src/contexts/
├── inventory/                  ← Bounded Context completo
│   ├── stock-levels/           ← Module interno
│   ├── batches/                ← Module interno
│   └── movements/              ← Module interno
│
├── catalog/                    ← Bounded Context completo
│   ├── products/               ← Module interno
│   ├── categories/             ← Module interno
│   └── ingredients/            ← Module interno (podría ir a Inventory)
│
└── shared-kernel/              ← Shared entre contextos
    └── units/                  ← Usado por múltiples contextos
```

**Ventajas:**
- ✅ Fronteras claras de contextos
- ✅ Lenguaje ubicuo por contexto
- ✅ Fácil identificar dependencias
- ✅ Preparado para microservicios

---

## 🎓 Estilo CodelyTV

### CodelyTV organiza por Bounded Contexts pequeños:

```
src/contexts/
│
├── mooc/                       ← Contexto: Cursos online
│   ├── courses/
│   ├── students/
│   └── video/
│
├── backoffice/                 ← Contexto: Administración
│   ├── courses/                ← "Course" significa algo diferente aquí
│   ├── analytics/
│   └── users/
│
└── shared/                     ← Shared kernel
    └── domain/
```

**Características:**
- ✅ Contextos pequeños y cohesivos
- ✅ Mismo concepto ("Course") en múltiples contextos
- ✅ Cada contexto tiene su propio modelo
- ✅ Comunicación vía eventos de dominio

---

## 🚀 Recomendación para Tu Proyecto

### Fase 1: Refactor Conservador (Corto Plazo)

```
src/contexts/
│
├── catalog/                    ← BC: Catálogo (productos, categorías)
│   ├── products/
│   └── categories/
│
├── inventory/                  ← BC: Inventario (stock, lotes, ingredientes)
│   ├── stock-levels/
│   ├── batches/
│   └── ingredients/
│
├── kitchen/                    ← BC: Cocina (recetas, transformaciones)
│   ├── recipes/
│   └── transformations/
│
└── shared/                     ← Shared kernel
    ├── units/
    └── domain/
```

---

### Fase 2: Contextos Granulares (Largo Plazo)

```
src/contexts/
│
├── product-catalog/
├── inventory-management/
├── ingredient-catalog/
├── recipe-management/
├── stock-purchasing/
├── measurement-units/        ← Shared kernel
└── sales-management/
```

---

## 📝 Resumen: Context vs Module

| Concepto | Bounded Context | Module |
|----------|----------------|--------|
| **Es** | Frontera de modelo | Carpeta organizativa |
| **Contiene** | Múltiples módulos | Agregados relacionados |
| **Nivel** | Estratégico | Táctico |
| **Ejemplo** | `inventory/` (contexto) | `inventory/stock-levels/` (módulo) |
| **Tu caso** | `src/contexts/inventory/` | `inventory/domain/inventory-level/` |

---

## ✅ Respuesta Directa

**"¿Cómo estaría organizado Inventory si fuera por Bounded Context?"**

```
src/contexts/inventory/              ← BOUNDED CONTEXT
│
├── domain/                          ← Modelo del contexto
│   ├── stock-level/                 ← Module/Subdomain
│   │   ├── inventory-level.ts       (Aggregate Root)
│   │   └── inventory-movement.ts    (Entity)
│   │
│   ├── batch/                       ← Module/Subdomain
│   │   └── inventory-batch.ts       (Aggregate Root)
│   │
│   └── shared/                      ← Shared dentro del contexto
│       └── quantity.ts
│
├── application/                     ← Use cases del contexto
├── infrastructure/                  ← Adaptadores
└── presentation/                    ← API del contexto
```

**La diferencia clave:**
- Antes: `src/modules/inventory/` (ambiguo)
- Ahora: `src/contexts/inventory/` (contexto delimitado completo)

---

¿Quieres que refactorice tu estructura actual para organizarla por Bounded Contexts?
