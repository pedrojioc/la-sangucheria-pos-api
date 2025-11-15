# 📊 Análisis del Sistema de Eventos de Dominio

**Fecha:** 2025-11-03
**Estado del Proyecto:** Desarrollo Activo - Base Implementation Phase
**Arquitectura:** Onion Architecture + DDD + CQRS + Event Sourcing

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Aspectos Positivos](#aspectos-positivos)
3. [Problemas Críticos](#problemas-críticos)
4. [Recomendaciones Priorizadas](#recomendaciones-priorizadas)
5. [Código de Ejemplo Mejorado](#código-de-ejemplo-mejorado)
6. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Resumen Ejecutivo

El sistema de eventos de dominio implementado tiene una **arquitectura base sólida** siguiendo principios DDD y Event Sourcing, pero presenta **inconsistencias críticas** y **ausencia de características enterprise** necesarias para producción.

### Puntuación General

| Aspecto | Puntuación | Estado |
|---------|-----------|--------|
| Arquitectura Base | 8/10 | ✅ Bueno |
| Consistencia | 4/10 | 🔴 Crítico |
| Completitud | 5/10 | 🟡 Incompleto |
| Escalabilidad | 6/10 | 🟡 Mejorable |
| Mantenibilidad | 5/10 | 🟡 Mejorable |
| **TOTAL** | **5.6/10** | 🟡 **Requiere Mejoras** |

---

## ✅ Aspectos Positivos (Lo que está bien)

### 1. **Arquitectura Base Sólida**

#### ✅ Separación de Capas Correcta

```
Domain Layer (Pure)
├── DomainEvent (abstract class)
├── EventBus (abstract class)
└── DomainEventSubscriber (interface)

Infrastructure Layer
├── InMemoryNestEventBus (implementación)
├── EventStoreService (persistencia)
└── PersistDomainEventsSubscriber
```

**Beneficios:**
- Dominio no depende de frameworks
- Fácil cambio de implementación (Redis, RabbitMQ, etc.)
- Testeable con mocks

#### ✅ Event Sourcing Automático

```typescript
// Todos los eventos se persisten automáticamente
@OnEvent('**', { async: true })
async handleDomainEvent(event: DomainEvent): Promise<void> {
  await this.eventStoreService.save(event)
}
```

**Beneficios:**
- Auditoría completa sin esfuerzo adicional
- Replay de eventos posible
- Debugging histórico

### 2. **Buenas Prácticas DDD**

#### ✅ Eventos Inmutables

```typescript
export class ProductCreatedEvent extends DomainEvent {
  readonly name: string          // ✅ Inmutable
  readonly categoryId: string    // ✅ Inmutable
  readonly price: number         // ✅ Inmutable
}
```

#### ✅ Patrón Aggregate + Events

```typescript
// Agregado registra eventos
const product = Product.create(...)
product.record(new ProductCreatedEvent(...))  // ✅ Registro interno

// Use case publica después de persistencia
await repository.save(product)
await eventBus.publish(product.pullDomainEvents())  // ✅ Publicación tras save
```

### 3. **Infraestructura Robusta**

#### ✅ Manejo de Errores No Destructivo

```typescript
try {
  await subscriber.on(event)
} catch (error) {
  console.error(...)
  // ✅ No lanza error, no interrumpe otros subscribers
}
```

#### ✅ Asincronía con setImmediate

```typescript
events.forEach(event => {
  setImmediate(() => {  // ✅ No bloquea el flujo principal
    this.eventEmitter.emit(event.eventName, event)
  })
})
```

---

## 🔴 Problemas Críticos

### **1. 🚨 INCONSISTENCIA CRÍTICA: Dos patrones diferentes de eventos**

#### Patrón A: Campos Individuales (❌ Verboso y con duplicación)

**Ubicación:** [`src/modules/products/domain/events/product-created.event.ts`](../../modules/products/domain/events/product-created.event.ts)

```typescript
// ❌ PATRÓN A - 50+ líneas para un evento simple
interface ProductCreatedEventProps extends DomainEventConstructor {
  name: string
  categoryId: string
  price: number
  sku: string
  description: string | null
  recipeId: string | null
  image: string | null
  preparationTime: number | null
  isActive: boolean
  displayOrder: number
  tags: string[]
}

export class ProductCreatedEvent extends DomainEvent {
  readonly name: string
  readonly categoryId: string
  readonly price: number
  readonly sku: string
  readonly description: string | null
  // ... 6 campos más

  constructor({
    aggregateId,
    eventId,
    occurredOn,
    name,
    categoryId,
    price,
    sku,
    description,
    recipeId,
    image,
    preparationTime,
    isActive,
    displayOrder,
    tags
  }: ProductCreatedEventProps) {
    super({
      eventName: ProductCreatedEvent.EVENT_NAME,
      aggregateId,
      eventId,
      occurredOn
    })
    this.name = name               // 🚨 Duplicación
    this.categoryId = categoryId   // 🚨 Duplicación
    this.price = price             // 🚨 Duplicación
    // ... 8 líneas más de duplicación
  }

  toPrimitives(): DomainEventAttributes {
    return {
      name: this.name,
      categoryId: this.categoryId,
      price: this.price,
      // ... duplicación de nuevo
    }
  }
}
```

**Problemas:**
- 🚨 **Duplicación extrema** (campos declarados 4 veces)
- 🚨 **Difícil mantenimiento** (agregar campo = tocar 4 lugares)
- 🚨 **Propenso a errores** (olvidar actualizar `toPrimitives`)

#### Patrón B: Payload Agrupado (✅ Más limpio)

**Ubicación:** [`src/modules/ingredient-transformations/domain/events/ingredient-transformed.event.ts`](../../modules/ingredient-transformations/domain/events/ingredient-transformed.event.ts)

```typescript
// ✅ PATRÓN B - Conciso y mantenible
export interface IngredientTransformedEventPayload {
  transformationId: string
  recipeId: string
  baseIngredientId: string
  outputIngredientId: string
  inputQuantity: number
  inputUnitId: string
  outputQuantity: number
  outputUnitId: string
  wasteQuantity: number
  totalCost: number
  outputUnitCost: number
  currency: string
  performedAt: Date
  performedBy: string | null
}

export class IngredientTransformedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient.transformed'

  constructor(
    public readonly payload: IngredientTransformedEventPayload,  // ✅ Un solo objeto
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: IngredientTransformedEvent.EVENT_NAME,
      aggregateId: payload.transformationId,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      ...this.payload,  // ✅ Spread simple, no duplicación
      performedAt: this.payload.performedAt.toISOString()
    }
  }
}
```

**Beneficios:**
- ✅ **Sin duplicación** (payload se define una vez)
- ✅ **Fácil mantenimiento** (agregar campo = actualizar interface)
- ✅ **Type-safe** (TypeScript valida el payload completo)

#### 📊 Comparación

| Aspecto | Patrón A (Campos) | Patrón B (Payload) |
|---------|-------------------|---------------------|
| Líneas de código | ~100 líneas | ~40 líneas |
| Duplicación | 4 veces | 0 veces |
| Mantenibilidad | 🔴 Baja | ✅ Alta |
| Type Safety | 🟡 Parcial | ✅ Completo |
| Legibilidad | 🔴 Baja | ✅ Alta |

#### 🎯 Recomendación

**ESTANDARIZAR EN PATRÓN B (Payload)** en todos los módulos.

**Plan de Migración:**
1. Crear eventos nuevos con patrón B
2. Migrar eventos existentes gradualmente
3. Crear linter rule para enforces patrón B

---

### **2. 🚨 PROBLEMA: Firma incorrecta del constructor de DomainEvent**

#### Ubicación del Bug

**Archivo:** [`src/modules/inventory/domain/events/low-stock-detected.event.ts:19`](../../modules/inventory/domain/events/low-stock-detected.event.ts#L19)

```typescript
export class LowStockDetectedEvent extends DomainEvent {
  constructor(
    public readonly payload: LowStockDetectedEventPayload,
    eventId?: string,
    occurredOn?: Date
  ) {
    // 🚨 BUG: Pasa 3 argumentos individuales
    super(LowStockDetectedEvent.EVENT_NAME, eventId, occurredOn)
    //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //    Esto NO coincide con la firma del constructor de DomainEvent!
  }
}
```

#### Constructor Esperado

**Archivo:** [`src/shared/domain/events/domain-event.ts:13`](./domain-event.ts#L13)

```typescript
export abstract class DomainEvent {
  constructor(params: DomainEventConstructor) {  // ✅ Espera UN objeto
    const { aggregateId, eventName, eventId, occurredOn } = params
    // ...
  }
}

export interface DomainEventConstructor {
  eventName: string
  aggregateId: string
  eventId?: string
  occurredOn?: Date
}
```

#### Impacto

```typescript
// 🚨 Esto va a fallar en runtime:
const event = new LowStockDetectedEvent({
  ingredientId: '123',
  currentQuantity: 5,
  minimumQuantity: 10,
  unitId: 'kg',
  detectedAt: new Date()
})

// Error: Cannot destructure property 'aggregateId' of 'params' as it is undefined.
```

#### ✅ Corrección

```typescript
export class LowStockDetectedEvent extends DomainEvent {
  constructor(
    public readonly payload: LowStockDetectedEventPayload,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({  // ✅ Pasar objeto
      eventName: LowStockDetectedEvent.EVENT_NAME,
      aggregateId: payload.ingredientId,  // ✅ Incluir aggregateId
      eventId,
      occurredOn
    })
  }
}
```

#### Archivos Afectados

1. [`src/modules/inventory/domain/events/low-stock-detected.event.ts`](../../modules/inventory/domain/events/low-stock-detected.event.ts)
2. [`src/modules/inventory/domain/events/out-of-stock.event.ts`](../../modules/inventory/domain/events/out-of-stock.event.ts) (verificar si tiene el mismo problema)

---

### **3. 🚨 AUSENCIA: No hay eventos en métodos importantes del agregado**

#### Problema

**Archivo:** [`src/modules/products/domain/product.ts`](../../modules/products/domain/product.ts)

El agregado `Product` **NO emite eventos** en operaciones críticas del dominio:

```typescript
export class Product extends AggregateRoot {
  // ✅ SÍ emite evento
  static create(...): Product {
    const product = Product.fromPrimitives(...)
    product.record(new ProductCreatedEvent(...))  // ✅ Evento registrado
    return product
  }

  // ✅ SÍ emite evento
  update(...): void {
    this.name = new ProductName(name)
    // ...
    this.record(new ProductUpdatedEvent(...))  // ✅ Evento registrado
  }

  // ❌ NO emite evento
  updatePrice(newPrice: number): void {
    this.price = new ProductPrice(newPrice)
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductPriceChangedEvent(...))
  }

  // ❌ NO emite evento
  addTag(tag: string): void {
    this.tags = this.tags.add(tag)
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductTagAddedEvent(...))
  }

  // ❌ NO emite evento
  removeTag(tag: string): void {
    this.tags = this.tags.remove(tag)
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductTagRemovedEvent(...))
  }

  // ❌ NO emite evento
  activate(): void {
    this.isActive = ProductIsActive.active()
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductActivatedEvent(...))
  }

  // ❌ NO emite evento
  deactivate(): void {
    this.isActive = ProductIsActive.inactive()
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductDeactivatedEvent(...))
  }

  // ❌ NO emite evento
  updateImage(imageUrl: string, imageStorageKey: string): void {
    this.imageUrl = new ProductImageUrl(imageUrl)
    this.imageStorageKey = new ProductImageStorageKey(imageStorageKey)
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductImageUpdatedEvent(...))
  }

  // ❌ NO emite evento
  removeImage(): void {
    this.imageUrl = null
    this.imageStorageKey = null
    this.updatedAt = new Date()
    // 🚨 Falta: this.record(new ProductImageRemovedEvent(...))
  }
}
```

#### Impacto Crítico

**Pierdes trazabilidad completa** de cambios importantes en el dominio:

| Operación | Sin Evento | Con Evento |
|-----------|-----------|-----------|
| `updatePrice(150)` | Solo actualiza DB | ✅ Auditoría de cambio de precio |
| `activate()` | Solo cambia flag | ✅ Notificar catálogo online |
| `deactivate()` | Solo cambia flag | ✅ Remover de inventario disponible |
| `addTag('vegan')` | Solo actualiza array | ✅ Reindexar búsqueda |
| `updateImage(...)` | Solo actualiza URL | ✅ Invalidar CDN cache |

#### Casos de Uso Reales Afectados

**1. Cambio de Precio (ProductPriceChangedEvent)**

Sin evento, NO puedes:
- ❌ Auditar historial de precios para análisis de negocio
- ❌ Notificar a clientes que tienen el producto en favoritos
- ❌ Actualizar precios en caché distribuido
- ❌ Disparar recálculo de costos de recetas

**2. Activación/Desactivación (ProductActivatedEvent / ProductDeactivatedEvent)**

Sin evento, NO puedes:
- ❌ Publicar automáticamente en plataformas de delivery
- ❌ Notificar cambios al sistema de inventario
- ❌ Actualizar índices de búsqueda en tiempo real
- ❌ Auditar quién y cuándo desactivó productos

**3. Cambio de Imagen (ProductImageUpdatedEvent)**

Sin evento, NO puedes:
- ❌ Invalidar caché de CDN (Cloudflare Images)
- ❌ Generar thumbnails asíncronamente
- ❌ Auditar cambios visuales del producto
- ❌ Sincronizar con sistemas externos (apps móviles)

#### ✅ Solución Recomendada

**Crear eventos granulares para cada operación de dominio:**

```typescript
// Nuevos eventos a crear:
src/modules/products/domain/events/
├── product-price-changed.event.ts      // 🆕
├── product-activated.event.ts          // 🆕
├── product-deactivated.event.ts        // 🆕
├── product-tag-added.event.ts          // 🆕
├── product-tag-removed.event.ts        // 🆕
├── product-image-updated.event.ts      // ��
└── product-image-removed.event.ts      // 🆕
```

**Ejemplo: ProductPriceChangedEvent**

```typescript
export interface ProductPriceChangedPayload {
  productId: string
  productName: string
  previousPrice: number
  newPrice: number
  priceChangePercentage: number
  currency: string
  changedAt: Date
  changedBy?: string
  reason?: string  // "promotion", "cost_increase", "manual", etc.
}

export class ProductPriceChangedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product.price_changed'
  static readonly VERSION = 1

  constructor(
    public readonly payload: ProductPriceChangedPayload,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductPriceChangedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      ...this.payload,
      changedAt: this.payload.changedAt.toISOString()
    }
  }

  static fromPrimitives(params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    attributes: DomainEventAttributes
  }): ProductPriceChangedEvent {
    return new ProductPriceChangedEvent(
      {
        productId: params.attributes.productId as string,
        productName: params.attributes.productName as string,
        previousPrice: params.attributes.previousPrice as number,
        newPrice: params.attributes.newPrice as number,
        priceChangePercentage: params.attributes.priceChangePercentage as number,
        currency: params.attributes.currency as string,
        changedAt: new Date(params.attributes.changedAt as string),
        changedBy: params.attributes.changedBy as string | undefined,
        reason: params.attributes.reason as string | undefined
      },
      params.eventId,
      params.occurredOn
    )
  }
}
```

**Actualizar Agregado:**

```typescript
export class Product extends AggregateRoot {
  updatePrice(newPrice: number, changedBy?: string, reason?: string): void {
    const previousPrice = this.price.value

    this.price = new ProductPrice(newPrice)
    this.updatedAt = new Date()

    // ✅ Registrar evento con contexto completo
    this.record(
      new ProductPriceChangedEvent({
        productId: this.id.value,
        productName: this.name.value,
        previousPrice,
        newPrice,
        priceChangePercentage: ((newPrice - previousPrice) / previousPrice) * 100,
        currency: 'PEN',  // O obtener de configuración
        changedAt: new Date(),
        changedBy,
        reason
      })
    )
  }
}
```

---

### **4. 🚨 PROBLEMA: Falta metadatos contextuales en eventos**

#### Estado Actual

**Archivo:** [`src/shared/domain/events/domain-event.ts`](./domain-event.ts)

```typescript
export abstract class DomainEvent {
  readonly aggregateId: string    // ✅ Tiene
  readonly eventId: string         // ✅ Tiene
  readonly occurredOn: Date        // ✅ Tiene
  readonly eventName: string       // ✅ Tiene

  // 🚨 FALTA información crucial:
  // readonly userId?: string           // ¿Quién ejecutó la acción?
  // readonly userName?: string         // Nombre legible para auditoría
  // readonly correlationId?: string    // Para tracing distribuido
  // readonly causationId?: string      // ¿Qué evento causó este?
  // readonly aggregateVersion?: number // Para optimistic locking
  // readonly metadata?: Record<string, unknown>  // Extensible
}
```

#### Problemas Sin Metadatos

**1. No puedes responder preguntas de negocio:**
- ❓ ¿Quién cambió el precio del producto X?
- ❓ ¿Desde qué IP se desactivó el producto?
- ❓ ¿Qué evento causó que se creara esta orden?

**2. No puedes hacer tracing distribuido:**
```
HTTP Request (correlationId: abc-123)
  → CreateOrderCommand
    → OrderCreatedEvent (correlationId: abc-123)
      → InventoryDeductedEvent (correlationId: abc-123, causationId: order-created)
        → LowStockDetectedEvent (correlationId: abc-123, causationId: inventory-deducted)

// 🚨 Sin correlationId, no puedes trazar la cadena completa
```

**3. No puedes implementar optimistic locking:**
```typescript
// Dos usuarios editan el mismo producto simultáneamente
// Sin aggregateVersion, el último write gana (lost update problem)

User A: lee Product v1 → actualiza → guarda como v2 ✅
User B: lee Product v1 → actualiza → guarda como v2 🚨 (sobreescribe cambios de A)

// Con aggregateVersion:
User A: lee v1 → actualiza → guarda v2 ✅
User B: lee v1 → actualiza → error "version mismatch" ✅
```

#### ✅ Solución: Metadatos Completos

```typescript
// Actualizar DomainEvent base
export interface DomainEventMetadata {
  userId?: string              // Usuario que ejecutó la acción
  userName?: string            // Nombre legible del usuario
  correlationId?: string       // ID para tracing de requests distribuidos
  causationId?: string         // ID del evento que causó este evento
  ipAddress?: string           // IP del cliente (auditoría)
  userAgent?: string           // User agent (auditoría)
  sessionId?: string           // Sesión del usuario
  tenantId?: string            // Multi-tenancy support
  environment?: string         // "production" | "staging" | "dev"
  [key: string]: unknown       // Extensible para casos específicos
}

export interface DomainEventConstructor {
  eventName: string
  aggregateId: string
  eventId?: string
  occurredOn?: Date
  metadata?: DomainEventMetadata  // 🆕
}

export abstract class DomainEvent {
  static EVENT_NAME: string

  readonly aggregateId: string
  readonly eventId: string
  readonly occurredOn: Date
  readonly eventName: string
  readonly metadata: DomainEventMetadata  // 🆕

  constructor(params: DomainEventConstructor) {
    const { aggregateId, eventName, eventId, occurredOn, metadata } = params
    this.aggregateId = aggregateId
    this.eventId = eventId || Uuid.random().value
    this.occurredOn = occurredOn || new Date()
    this.eventName = eventName
    this.metadata = metadata || {}  // 🆕
  }

  // ... resto del código
}
```

#### Uso en Use Cases

```typescript
export class UpdateProductPrice {
  async run(
    productId: string,
    newPrice: number,
    context: {
      userId: string
      userName: string
      correlationId: string
      ipAddress?: string
    }
  ): Promise<void> {
    const product = await this.repository.findById(new ProductId(productId))
    if (!product) throw new ProductNotFound(productId)

    product.updatePrice(
      newPrice,
      context.userId,
      'manual'
    )

    // Los eventos ahora incluyen metadata
    const events = product.pullDomainEvents()

    // Enriquecer eventos con metadata del contexto
    const enrichedEvents = events.map(event => ({
      ...event,
      metadata: {
        userId: context.userId,
        userName: context.userName,
        correlationId: context.correlationId,
        ipAddress: context.ipAddress,
        environment: process.env.NODE_ENV
      }
    }))

    await this.repository.save(product)
    await this.eventBus.publish(enrichedEvents)
  }
}
```

#### Beneficios

✅ **Auditoría Completa:**
```sql
-- Query: ¿Quién cambió precios en los últimos 7 días?
SELECT
  event_data->>'eventName' as event_type,
  event_data->'metadata'->>'userName' as changed_by,
  event_data->'payload'->>'previousPrice' as old_price,
  event_data->'payload'->>'newPrice' as new_price,
  occurred_at
FROM event_store
WHERE event_type = 'product.price_changed'
  AND occurred_at > NOW() - INTERVAL '7 days'
ORDER BY occurred_at DESC;
```

✅ **Tracing Distribuido:**
```typescript
// Todos los eventos de un request tienen el mismo correlationId
const events = await eventStore.findByCorrelationId('abc-123')
// Resultado:
// 1. OrderCreatedEvent (causationId: null)
// 2. InventoryDeductedEvent (causationId: order-created-event-id)
// 3. LowStockDetectedEvent (causationId: inventory-deducted-event-id)
```

✅ **Optimistic Locking:**
```typescript
// AggregateRoot
export abstract class AggregateRoot {
  private version: number = 0  // 🆕

  incrementVersion(): void {
    this.version++
  }

  getVersion(): number {
    return this.version
  }
}

// Repository
async save(product: Product): Promise<void> {
  const currentVersion = product.getVersion()

  const result = await this.repository.update(
    { id: product.id.value, version: currentVersion },  // WHERE clause
    { ...product.toPrimitives(), version: currentVersion + 1 }
  )

  if (result.affected === 0) {
    throw new ConcurrentModificationException(
      `Product ${product.id.value} was modified by another transaction`
    )
  }
}
```

---

### **5. 🟡 PROBLEMA: Manejo de errores en EventBus es silencioso**

#### Estado Actual

**Archivo:** [`src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts:32-41`](../../shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts#L32-L41)

```typescript
subscriber.subscribedTo().forEach(eventClass => {
  this.eventEmitter.on(eventClass.EVENT_NAME, async (event: DomainEvent) => {
    try {
      await subscriber.on(event)
    } catch (error) {
      console.error(  // 🚨 Solo console.error
        `Error handling event ${eventClass.EVENT_NAME} with subscriber ${subscriber.constructor.name}:`,
        error
      )
      // 🚨 No lanza error, no hay retry, no hay logging estructurado
    }
  })
})
```

#### Problemas

**1. Pérdida Silenciosa de Eventos**
```typescript
// Subscriber falla por error transitorio (DB timeout)
await subscriber.on(event)  // 💥 Falla

// Resultado:
// - Evento se pierde (no se reintenta)
// - Solo un console.error que nadie ve en producción
// - No hay alerta
```

**2. No Hay Visibilidad en Producción**
```typescript
// console.error en producción:
// ❌ No está en sistema de logging (Datadog, Sentry)
// ❌ No genera alertas
// ❌ No tiene context (userId, correlationId, etc.)
// ❌ Se pierde si el proceso muere
```

**3. No Hay Retry Automático**
```typescript
// Casos donde retry sería útil:
// - Database connection timeout (transitorio)
// - External API rate limit (transitorio)
// - Redis connection lost (transitorio)

// Sin retry, estos eventos se pierden permanentemente
```

**4. No Hay Dead-Letter Queue**
```typescript
// Eventos que fallan después de N retries:
// ❌ Se pierden sin trace
// ❌ No hay forma de reprocessarlos manualmente
// ❌ No hay auditoría de fallos
```

#### ✅ Solución: Sistema de Errores Robusto

**Paso 1: Logger Estructurado**

```typescript
// shared/infrastructure/logging/logger.service.ts
import { Injectable } from '@nestjs/common'
import * as winston from 'winston'

@Injectable()
export class Logger {
  private logger: winston.Logger

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        // En producción, agregar:
        // new winston.transports.Datadog({ ... }),
        // new winston.transports.Sentry({ ... })
      ]
    })
  }

  error(message: string, context: Record<string, unknown>, error?: Error): void {
    this.logger.error(message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    })
  }
}
```

**Paso 2: Retry con Exponential Backoff**

```typescript
// shared/infrastructure/event-bus/retry-policy.ts
export interface RetryPolicy {
  maxAttempts: number
  backoffMs: number
  backoffMultiplier: number
}

export class RetryHandler {
  constructor(private readonly policy: RetryPolicy) {}

  async execute<T>(
    fn: () => Promise<T>,
    context: { eventName: string; subscriberName: string }
  ): Promise<T> {
    let lastError: Error | undefined
    let backoff = this.policy.backoffMs

    for (let attempt = 1; attempt <= this.policy.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt === this.policy.maxAttempts) {
          break  // No more retries
        }

        console.warn(
          `Retry attempt ${attempt}/${this.policy.maxAttempts} for ${context.eventName}`,
          { backoffMs: backoff }
        )

        await this.sleep(backoff)
        backoff *= this.policy.backoffMultiplier
      }
    }

    throw lastError
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

**Paso 3: Dead-Letter Queue**

```typescript
// shared/infrastructure/event-bus/dead-letter-queue.service.ts
@Injectable()
export class DeadLetterQueueService {
  constructor(
    @InjectRepository(FailedEventEntity)
    private readonly repository: Repository<FailedEventEntity>
  ) {}

  async save(
    event: DomainEvent,
    subscriber: string,
    error: Error,
    attempts: number
  ): Promise<void> {
    await this.repository.save({
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      eventData: event.toPrimitives(),
      subscriberName: subscriber,
      errorMessage: error.message,
      errorStack: error.stack,
      attempts,
      failedAt: new Date(),
      status: 'failed'
    })
  }

  async reprocess(failedEventId: string): Promise<void> {
    const failedEvent = await this.repository.findOne({ where: { id: failedEventId } })
    if (!failedEvent) throw new Error('Failed event not found')

    // Re-publicar evento para reprocessamiento
    await this.eventBus.publish([
      // Reconstruir evento desde failedEvent.eventData
    ])

    await this.repository.update(failedEventId, { status: 'reprocessing' })
  }
}
```

**Paso 4: EventBus Mejorado**

```typescript
// shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts
export class InMemoryNestEventBus implements EventBus {
  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(IN_MEMORY_EVENT_SUBSCRIBERS) private subscribers: DomainSubscribersArray,
    private logger: Logger,  // 🆕
    private retryHandler: RetryHandler,  // 🆕
    private deadLetterQueue: DeadLetterQueueService  // 🆕
  ) {
    this.addSubscribers(this.subscribers)
  }

  addSubscribers(subscribers: DomainSubscribersArray): void {
    subscribers.forEach(subscriber => {
      subscriber.subscribedTo().forEach(eventClass => {
        this.eventEmitter.on(eventClass.EVENT_NAME, async (event: DomainEvent) => {
          const context = {
            eventName: event.eventName,
            subscriberName: subscriber.constructor.name,
            eventId: event.eventId,
            aggregateId: event.aggregateId,
            metadata: event.metadata
          }

          try {
            // 🆕 Ejecutar con retry policy
            await this.retryHandler.execute(
              () => subscriber.on(event),
              context
            )

            // ✅ Log de éxito
            this.logger.info('Event processed successfully', context)
          } catch (error) {
            // 🆕 Logger estructurado
            this.logger.error(
              'Event processing failed after all retries',
              context,
              error as Error
            )

            // 🆕 Guardar en Dead-Letter Queue
            await this.deadLetterQueue.save(
              event,
              subscriber.constructor.name,
              error as Error,
              this.retryHandler.policy.maxAttempts
            )

            // 🆕 Notificar a sistema de alertas (Sentry, PagerDuty, etc.)
            // await this.alertingService.sendAlert({ ... })
          }
        })
      })
    })
  }
}
```

#### Configuración

```typescript
// event-bus.module.ts
@Module({
  providers: [
    {
      provide: RetryHandler,
      useValue: new RetryHandler({
        maxAttempts: 3,
        backoffMs: 100,
        backoffMultiplier: 2  // 100ms → 200ms → 400ms
      })
    },
    Logger,
    DeadLetterQueueService,
    InMemoryNestEventBus
  ]
})
export class EventBusModule {}
```

#### Beneficios

✅ **Resilencia:**
- Retry automático en fallos transitorios
- Backoff exponencial evita sobrecarga

✅ **Visibilidad:**
- Logs estructurados con contexto completo
- Integración con Datadog/Sentry

✅ **Recuperación:**
- Dead-Letter Queue para eventos fallidos
- Endpoint para reprocessar manualmente

✅ **Alerting:**
- Notificaciones automáticas en fallos críticos
- Dashboard de salud del sistema

---

### **6. 🟡 AUSENCIA: No hay versionado de eventos**

#### Problema

**Archivo:** [`src/shared/domain/events/domain-event.ts`](./domain-event.ts)

```typescript
export abstract class DomainEvent {
  static EVENT_NAME: string  // ✅ Tiene
  // 🚨 FALTA: static VERSION = 1
}
```

#### ¿Por Qué Es Crítico?

**Sin versionado, no puedes evolucionar eventos sin romper compatibilidad.**

**Escenario Real:**

```typescript
// Enero 2025 - Versión 1 del evento
export class ProductCreatedEvent extends DomainEvent {
  static EVENT_NAME = 'product.created'
  // 🚨 Sin VERSION

  constructor(
    public readonly payload: {
      productId: string
      name: string
      price: number  // En soles (PEN)
    }
  ) {}
}

// Evento persistido en Event Store:
{
  "eventName": "product.created",
  "attributes": {
    "productId": "123",
    "name": "Sandwich",
    "price": 15  // Asumido en PEN
  }
}
```

```typescript
// Junio 2025 - Expansión a Colombia, necesitas multi-moneda
export class ProductCreatedEvent extends DomainEvent {
  static EVENT_NAME = 'product.created'
  // 🚨 Mismo EVENT_NAME, schema diferente

  constructor(
    public readonly payload: {
      productId: string
      name: string
      price: number
      currency: string  // 🆕 Campo nuevo requerido
    }
  ) {}
}

// Nuevo evento:
{
  "eventName": "product.created",
  "attributes": {
    "productId": "456",
    "name": "Arepa",
    "price": 12000,
    "currency": "COP"  // 🆕
  }
}
```

**Problema al Replay:**

```typescript
// Intentas hacer replay de eventos históricos
const events = await eventStore.findAll()

for (const event of events) {
  const domainEvent = ProductCreatedEvent.fromPrimitives(event)
  // 💥 ERROR: eventos antiguos no tienen "currency"
  // ¿Cómo sabes si price=15 es PEN o USD o COP?
}
```

#### ✅ Solución: Event Versioning + Upcasting

**Paso 1: Agregar VERSION a eventos**

```typescript
// domain-event.ts
export abstract class DomainEvent {
  static EVENT_NAME: string
  static VERSION: number  // 🆕

  readonly aggregateId: string
  readonly eventId: string
  readonly occurredOn: Date
  readonly eventName: string
  readonly version: number  // 🆕

  constructor(params: DomainEventConstructor & { version?: number }) {
    // ...
    this.version = params.version || (this.constructor as any).VERSION || 1
  }
}
```

**Paso 2: Versionar eventos existentes**

```typescript
// product-created.event.ts
export class ProductCreatedEventV1 extends DomainEvent {
  static readonly EVENT_NAME = 'product.created'
  static readonly VERSION = 1  // 🆕

  constructor(
    public readonly payload: {
      productId: string
      name: string
      price: number
      // Sin currency (asume PEN)
    },
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductCreatedEventV1.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductCreatedEventV1.VERSION,  // 🆕
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductCreatedEventV1.VERSION,  // 🆕
      ...this.payload
    }
  }
}
```

**Paso 3: Crear nueva versión**

```typescript
// product-created.event.v2.ts
export class ProductCreatedEventV2 extends DomainEvent {
  static readonly EVENT_NAME = 'product.created'
  static readonly VERSION = 2  // 🆕 Nueva versión

  constructor(
    public readonly payload: {
      productId: string
      name: string
      price: number
      currency: string  // 🆕 Campo nuevo
    },
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductCreatedEventV2.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductCreatedEventV2.VERSION,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductCreatedEventV2.VERSION,
      ...this.payload
    }
  }
}
```

**Paso 4: Event Upcaster (Migrador de Eventos)**

```typescript
// shared/infrastructure/event-sourcing/event-upcaster.service.ts
@Injectable()
export class EventUpcasterService {
  private upcasters: Map<string, EventUpcaster[]> = new Map()

  constructor() {
    this.registerUpcasters()
  }

  private registerUpcasters(): void {
    // Registrar upcaster de v1 a v2 de ProductCreatedEvent
    this.register(
      'product.created',
      new ProductCreatedEventV1toV2Upcaster()
    )
  }

  register(eventName: string, upcaster: EventUpcaster): void {
    const existing = this.upcasters.get(eventName) || []
    this.upcasters.set(eventName, [...existing, upcaster])
  }

  async upcast(rawEvent: any): Promise<DomainEvent> {
    const eventName = rawEvent.eventData.eventName
    const version = rawEvent.eventData.version || 1

    const upcasters = this.upcasters.get(eventName) || []

    // Aplicar upcasters en cadena
    let upcastedData = rawEvent.eventData

    for (const upcaster of upcasters) {
      if (upcaster.canUpcast(version)) {
        upcastedData = upcaster.upcast(upcastedData)
      }
    }

    // Reconstruir evento con la versión más reciente
    return this.reconstructEvent(eventName, upcastedData)
  }
}

// Upcaster específico
export class ProductCreatedEventV1toV2Upcaster implements EventUpcaster {
  canUpcast(version: number): boolean {
    return version === 1
  }

  upcast(eventData: any): any {
    return {
      ...eventData,
      version: 2,
      attributes: {
        ...eventData.attributes,
        currency: 'PEN'  // 🆕 Default para eventos antiguos
      }
    }
  }
}
```

**Paso 5: Usar en Event Replay**

```typescript
// application/replay-events.use-case.ts
export class ReplayEvents {
  constructor(
    private eventStore: EventStoreService,
    private upcaster: EventUpcasterService,
    private eventBus: EventBus
  ) {}

  async run(fromDate: Date, toDate: Date): Promise<void> {
    const rawEvents = await this.eventStore.findBetween(fromDate, toDate)

    for (const rawEvent of rawEvents) {
      // 🆕 Upcast automático a versión más reciente
      const domainEvent = await this.upcaster.upcast(rawEvent)

      // Ahora todos los eventos tienen el mismo schema (v2)
      await this.eventBus.publish([domainEvent])
    }
  }
}
```

#### Beneficios

✅ **Backward Compatibility:**
- Eventos antiguos se migran automáticamente
- No necesitas modificar Event Store

✅ **Evolución Segura:**
- Puedes cambiar schemas sin romper nada
- Upcasters testables independientemente

✅ **Event Replay Funcional:**
- Replay de 5 años de eventos sin problemas
- Todos los eventos se normalizan a versión actual

✅ **Auditoría Preservada:**
- Eventos originales intactos en Event Store
- Upcasting solo en memoria durante replay

#### Estrategia de Versionado

| Cambio | Acción |
|--------|--------|
| Agregar campo opcional | Misma versión |
| Agregar campo requerido | Nueva versión + Upcaster |
| Renombrar campo | Nueva versión + Upcaster |
| Eliminar campo | Nueva versión (omitir en nuevo schema) |
| Cambiar tipo de dato | Nueva versión + Upcaster |

---

### **7. 🟡 PROBLEMA: Falta tipado fuerte en `fromPrimitives`**

#### Problema

**Archivo:** [`src/modules/products/domain/events/product-created.event.ts:83-107`](../../modules/products/domain/events/product-created.event.ts#L83-L107)

```typescript
static fromPrimitives(params: {
  aggregateId: string
  eventId: string
  occurredOn: Date
  attributes: DomainEventAttributes  // 🚨 Tipo genérico Record<string, unknown>
}): DomainEvent {
  const { aggregateId, eventId, occurredOn, attributes } = params
  return new ProductCreatedEvent({
    eventName: ProductCreatedEvent.EVENT_NAME,
    aggregateId,
    eventId,
    occurredOn,
    // 🚨 Castings inseguros sin validación
    name: attributes.name as string,
    categoryId: attributes.categoryId as string,
    price: attributes.price as number,
    sku: attributes.sku as string,
    description: attributes.description as string | null,
    recipeId: attributes.recipeId as string | null,
    image: attributes.image as string | null,
    preparationTime: attributes.preparationTime as number | null,
    isActive: attributes.isActive as boolean,
    displayOrder: attributes.displayOrder as number,
    tags: attributes.tags as string[]  // 🚨 Puede ser undefined, null, o tipo incorrecto
  })
}
```

#### Consecuencias

**1. Runtime Errors Silenciosos:**

```typescript
// Event Store corrupto o evento de versión antigua
const corruptedEvent = {
  aggregateId: "123",
  eventId: "abc",
  occurredOn: new Date(),
  attributes: {
    name: "Product",
    price: "15.50",  // 🚨 String en vez de number
    tags: null       // 🚨 null en vez de array
  }
}

const event = ProductCreatedEvent.fromPrimitives(corruptedEvent)
// ✅ No falla en construcción

// Pero falla después:
const totalPrice = event.price * 2
// 💥 NaN (porque "15.50" * 2 = NaN)

event.tags.forEach(...)
// 💥 Cannot read property 'forEach' of null
```

**2. Falta Validación de Negocio:**

```typescript
const invalidEvent = {
  aggregateId: "123",
  eventId: "abc",
  occurredOn: new Date(),
  attributes: {
    name: "",           // 🚨 Nombre vacío (inválido para ProductName)
    price: -100,        // 🚨 Precio negativo (inválido para ProductPrice)
    tags: ["a".repeat(1000)]  // 🚨 Tag demasiado largo
  }
}

// ✅ Se construye sin problema (pero viola reglas de dominio)
const event = ProductCreatedEvent.fromPrimitives(invalidEvent)
```

**3. Difícil de Mantener:**

```typescript
// Agregar campo nuevo:
interface ProductCreatedEventPayload {
  // ...
  taxRate: number  // 🆕
}

// Hay que recordar actualizar 3 lugares:
// 1. Interface ✅
// 2. Constructor ✅
// 3. fromPrimitives ❌ (fácil de olvidar)
```

#### ✅ Solución: Validación con Zod

**Paso 1: Instalar Zod**

```bash
pnpm add zod
```

**Paso 2: Definir Schema**

```typescript
// product-created.event.ts
import { z } from 'zod'

// 🆕 Schema de validación
const ProductCreatedEventPayloadSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  price: z.number().positive(),
  sku: z.string().min(1),
  description: z.string().nullable(),
  recipeId: z.string().uuid().nullable(),
  image: z.string().url().nullable(),
  preparationTime: z.number().int().positive().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
  tags: z.array(z.string().max(50))
})

type ProductCreatedEventPayload = z.infer<typeof ProductCreatedEventPayloadSchema>

export class ProductCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product.created'
  static readonly VERSION = 1

  constructor(
    public readonly payload: ProductCreatedEventPayload,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductCreatedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductCreatedEvent.VERSION,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductCreatedEvent.VERSION,
      ...this.payload
    }
  }

  static fromPrimitives(params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    attributes: DomainEventAttributes
  }): ProductCreatedEvent {
    // 🆕 Validación automática con Zod
    try {
      const validated = ProductCreatedEventPayloadSchema.parse(params.attributes)

      return new ProductCreatedEvent(
        validated,
        params.eventId,
        params.occurredOn
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new EventDeserializationException(
          `Failed to deserialize ${ProductCreatedEvent.EVENT_NAME}`,
          {
            eventId: params.eventId,
            aggregateId: params.aggregateId,
            validationErrors: error.errors
          }
        )
      }
      throw error
    }
  }
}
```

**Paso 3: Exception Específica**

```typescript
// shared/domain/events/exceptions/event-deserialization.exception.ts
export class EventDeserializationException extends DomainException {
  constructor(
    message: string,
    public readonly context: {
      eventId: string
      aggregateId: string
      validationErrors: any[]
    }
  ) {
    super(message)
    this.name = 'EventDeserializationException'
  }
}
```

**Paso 4: Safe Parse para Logging**

```typescript
// event-upcaster.service.ts (mejorado)
async reconstructEvent(eventName: string, eventData: any): Promise<DomainEvent> {
  const EventClass = this.getEventClass(eventName)

  try {
    return EventClass.fromPrimitives(eventData)
  } catch (error) {
    if (error instanceof EventDeserializationException) {
      // Log detallado del error
      this.logger.error('Event deserialization failed', {
        eventName,
        eventId: error.context.eventId,
        aggregateId: error.context.aggregateId,
        errors: error.context.validationErrors,
        rawData: eventData
      })

      // Guardar en tabla de eventos fallidos para análisis
      await this.deadLetterQueue.save(eventData, error)
    }
    throw error
  }
}
```

#### Beneficios

✅ **Type Safety:**
- Validación automática en runtime
- TypeScript infiere tipos desde Zod schema

✅ **Errores Claros:**
```typescript
// Antes:
// 💥 Cannot read property 'forEach' of null (línea 245)

// Después:
// 💥 EventDeserializationException: Failed to deserialize product.created
//    Validation errors:
//    - tags: Expected array, received null
//    - price: Expected number, received string
```

✅ **Mantenibilidad:**
- Schema único como fuente de verdad
- Agregar campo = actualizar schema (TypeScript avisa del resto)

✅ **Documentación:**
```typescript
// Schema autodocumenta el contrato
const schema = z.object({
  price: z.number().positive().max(999999),  // Precio positivo, máx 999,999
  tags: z.array(z.string().max(50)).max(10)  // Máx 10 tags, cada uno ≤50 chars
})
```

---

### **8. 🟡 PROBLEMA: EventBus publica inmediatamente sin garantías transaccionales**

#### Problema

**Archivo:** [`src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts:15-22`](../../shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts#L15-L22)

```typescript
publish(events: DomainEvent[]): Promise<void> {
  events.forEach(event => {
    setImmediate(() => {  // 🚨 Asíncrono, no espera
      this.eventEmitter.emit(event.eventName, event)
    })
  })

  return Promise.resolve()  // 🚨 Retorna ANTES de publicar
}
```

#### Escenario de Fallo

```typescript
// Use Case
async run(productId: string, newPrice: number): Promise<void> {
  const product = await this.repository.findById(productId)
  product.updatePrice(newPrice)

  // 1. Guardar en DB ✅
  await this.repository.save(product)

  // 2. Publicar eventos ✅ (supuestamente)
  await this.eventBus.publish(product.pullDomainEvents())

  // 3. Promise.resolve() retorna inmediatamente
  //    pero eventos aún no se emitieron (están en setImmediate queue)
}

// 4. Proceso muere aquí (crash, deployment, etc.) 💥
//    Eventos se pierden porque setImmediate() nunca se ejecutó
```

#### Problema de Consistencia

```
┌─────────────────────────────────────┐
│ Transacción DB: COMMIT ✅           │
│ - Product precio actualizado        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ EventBus: publish() ✅              │
│ - Retorna Promise.resolve()         │
│ - Eventos en setImmediate queue     │
└─────────────────────────────────────┘
         ↓
      💥 CRASH
         ↓
┌─────────────────────────────────────┐
│ Resultado:                          │
│ - DB: Precio actualizado ✅         │
│ - Event Store: Sin evento ❌        │
│ - Subscribers: No ejecutados ❌     │
└─────────────────────────────────────┘
```

**Consecuencias:**
- ❌ Inconsistencia entre DB y Event Store
- ❌ Subscribers no reaccionan (cache no se invalida, notificaciones no se envían)
- ❌ Auditoría incompleta (falta el evento de cambio)

#### ✅ Solución: Transactional Outbox Pattern

**Concepto:**
1. Guardar eventos en tabla `outbox` en la MISMA transacción que el agregado
2. Worker separado lee `outbox` y publica eventos
3. Marcar como publicados tras confirmación

**Diagrama:**

```
┌──────────────────────────────────────────────────────────┐
│ Transacción DB (ACID)                                    │
│                                                           │
│  1. UPDATE products SET price = 150 WHERE id = '123'     │
│  2. INSERT INTO outbox (event_data) VALUES (...)         │
│                                                           │
│  COMMIT ✅ (ambas operaciones atómicas)                  │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Outbox Worker (polling cada 100ms)                       │
│                                                           │
│  1. SELECT * FROM outbox WHERE published = false         │
│  2. EventBus.publish(events)                             │
│  3. UPDATE outbox SET published = true                   │
│                                                           │
│  Si falla el proceso, eventos permanecen en outbox ✅    │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Event Bus → Subscribers                                  │
│                                                           │
│  - Cache invalidation                                    │
│  - Email notifications                                   │
│  - Event Store persistence                               │
└──────────────────────────────────────────────────────────┘
```

**Paso 1: Tabla Outbox**

```typescript
// shared/infrastructure/event-bus/outbox/outbox-message.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('outbox')
export class OutboxMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  eventId: string

  @Column({ type: 'varchar', length: 255 })
  eventName: string

  @Column({ type: 'uuid' })
  aggregateId: string

  @Column({ type: 'jsonb' })
  eventData: any

  @Column({ type: 'boolean', default: false })
  published: boolean

  @CreateDateColumn()
  createdAt: Date

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null

  @Column({ type: 'int', default: 0 })
  attempts: number

  @Column({ type: 'text', nullable: true })
  lastError: string | null
}
```

**Paso 2: Outbox Repository**

```typescript
// shared/infrastructure/event-bus/outbox/outbox-repository.ts
@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxMessageEntity)
    private readonly repository: Repository<OutboxMessageEntity>
  ) {}

  async save(events: DomainEvent[]): Promise<void> {
    const messages = events.map(event => ({
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      eventData: {
        eventId: event.eventId,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        occurredOn: event.occurredOn,
        attributes: event.toPrimitives()
      }
    }))

    await this.repository.save(messages)
  }

  async findUnpublished(limit: number = 100): Promise<OutboxMessageEntity[]> {
    return this.repository.find({
      where: { published: false },
      order: { createdAt: 'ASC' },
      take: limit
    })
  }

  async markAsPublished(ids: string[]): Promise<void> {
    await this.repository.update(
      { id: In(ids) },
      { published: true, publishedAt: new Date() }
    )
  }

  async incrementAttempts(id: string, error: string): Promise<void> {
    await this.repository.increment({ id }, 'attempts', 1)
    await this.repository.update(id, { lastError: error })
  }
}
```

**Paso 3: Transactional EventBus**

```typescript
// shared/infrastructure/event-bus/transactional-event-bus.ts
@Injectable()
export class TransactionalEventBus implements EventBus {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly dataSource: DataSource
  ) {}

  async publish(events: DomainEvent[]): Promise<void> {
    // 🆕 Guardar en outbox dentro de transacción actual
    await this.outboxRepository.save(events)

    // NO publicar directamente
    // El Outbox Worker se encargará
  }

  async addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    // Los subscribers se registran en InMemoryEventBus (usado por worker)
  }
}
```

**Paso 4: Outbox Worker**

```typescript
// shared/infrastructure/event-bus/outbox/outbox-worker.service.ts
@Injectable()
export class OutboxWorkerService {
  private isRunning = false

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventBus: InMemoryNestEventBus,  // EventBus real para publicar
    private readonly logger: Logger
  ) {}

  @Cron('*/1 * * * * *')  // Cada segundo
  async processOutbox(): Promise<void> {
    if (this.isRunning) return  // Evitar ejecuciones concurrentes

    this.isRunning = true

    try {
      const messages = await this.outboxRepository.findUnpublished(50)

      if (messages.length === 0) {
        return
      }

      this.logger.info(`Processing ${messages.length} outbox messages`)

      for (const message of messages) {
        try {
          // Reconstruir DomainEvent
          const event = this.reconstructEvent(message.eventData)

          // Publicar usando EventBus real
          await this.eventBus.publish([event])

          // Marcar como publicado
          await this.outboxRepository.markAsPublished([message.id])

          this.logger.debug(`Published outbox message ${message.id}`)
        } catch (error) {
          this.logger.error(
            `Failed to publish outbox message ${message.id}`,
            { messageId: message.id, error }
          )

          await this.outboxRepository.incrementAttempts(
            message.id,
            (error as Error).message
          )

          // Si falla muchas veces, mover a dead-letter
          if (message.attempts >= 10) {
            await this.moveToDeadLetter(message)
          }
        }
      }
    } finally {
      this.isRunning = false
    }
  }

  private reconstructEvent(eventData: any): DomainEvent {
    // Reconstruir usando event registry
    const EventClass = EventRegistry.get(eventData.eventName)
    return EventClass.fromPrimitives(eventData)
  }

  private async moveToDeadLetter(message: OutboxMessageEntity): Promise<void> {
    // Implementar lógica de dead-letter
    this.logger.error(`Moving message ${message.id} to dead-letter after 10 failed attempts`)
  }
}
```

**Paso 5: Configuración del Módulo**

```typescript
// event-bus.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxMessageEntity]),
    ScheduleModule.forRoot()  // Para @Cron
  ],
  providers: [
    OutboxRepository,
    OutboxWorkerService,
    {
      provide: EventBus,
      useClass: TransactionalEventBus  // 🆕 Usar versión transaccional
    },
    InMemoryNestEventBus,  // Para el worker
    Logger
  ],
  exports: [EventBus]
})
export class EventBusModule {}
```

**Paso 6: Migración**

```sql
-- migrations/XXXXXX_create_outbox_table.sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  aggregate_id UUID NOT NULL,
  event_data JSONB NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  attempts INT DEFAULT 0,
  last_error TEXT
);

CREATE INDEX idx_outbox_published ON outbox(published, created_at);
CREATE INDEX idx_outbox_event_name ON outbox(event_name);
CREATE INDEX idx_outbox_aggregate_id ON outbox(aggregate_id);
```

#### Beneficios

✅ **Garantía de Entrega:**
- Eventos persisten en DB junto al agregado (ACID)
- Si el proceso muere, eventos permanecen en outbox

✅ **At-Least-Once Delivery:**
- Worker reinicia automáticamente
- Idempotencia en subscribers maneja duplicados

✅ **Observabilidad:**
```sql
-- Ver eventos pendientes
SELECT * FROM outbox WHERE published = false;

-- Ver eventos fallidos
SELECT * FROM outbox WHERE attempts > 3 ORDER BY created_at DESC;

-- Throughput
SELECT
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published) as published
FROM outbox
GROUP BY minute
ORDER BY minute DESC;
```

✅ **Resilencia:**
- Fallo en EventBus no afecta transacción principal
- Retry automático con backoff
- Dead-letter para casos irrecuperables

#### Desventajas y Mitigaciones

❌ **Latencia:** Eventos no se publican inmediatamente

**Mitigación:**
- Polling frecuente (cada 100ms-1s)
- Para casos críticos, usar EventBus directo + outbox como backup

❌ **Duplicados:** Un evento puede publicarse 2 veces (fallo después de publish, antes de marcar como published)

**Mitigación:**
- Implementar idempotencia en subscribers:

```typescript
@Injectable()
export class IdempotentSubscriber implements DomainEventSubscriber<ProductCreatedEvent> {
  private processedEvents: Set<string> = new Set()

  async on(event: ProductCreatedEvent): Promise<void> {
    // Verificar si ya procesamos este evento
    if (this.processedEvents.has(event.eventId)) {
      return  // Skip duplicado
    }

    // Procesar evento
    await this.doWork(event)

    // Marcar como procesado
    this.processedEvents.add(event.eventId)
  }
}
```

---

### **9. 🟢 AUSENCIA: No hay tipos semánticos de eventos**

#### Problema

**Archivo:** [`src/shared/domain/events/domain-event.ts`](./domain-event.ts)

```typescript
// ❌ Todos los eventos son genéricos, sin distinción semántica
export abstract class DomainEvent {
  static EVENT_NAME: string
  // ...
}

// Todos heredan de la misma clase base
export class ProductCreatedEvent extends DomainEvent { }
export class ProductUpdatedEvent extends DomainEvent { }
export class ProductDeletedEvent extends DomainEvent { }
```

#### Limitaciones

**1. No hay semántica específica por tipo:**

```typescript
// ¿Cómo distinguir entre eventos de creación y actualización?
function handleEvent(event: DomainEvent) {
  if (event instanceof ProductCreatedEvent) {
    // ...
  } else if (event instanceof ProductUpdatedEvent) {
    // ... duplicación de lógica
  }
}

// Mejor:
function handleEvent(event: DomainEvent) {
  if (event instanceof CreatedEvent) {
    // Lógica común para TODOS los eventos de creación
  }
}
```

**2. No puedes hacer proyecciones genéricas:**

```typescript
// Quiero construir un read model de "últimos cambios"
// Necesito los 3 tipos de eventos: Created, Updated, Deleted

// Sin tipos semánticos:
subscriber.subscribedTo().forEach(eventClass => {
  if (eventClass.EVENT_NAME.includes('created') ||
      eventClass.EVENT_NAME.includes('updated') ||
      eventClass.EVENT_NAME.includes('deleted')) {
    // ... 🚨 Parsing de strings, frágil
  }
})

// Con tipos semánticos:
if (event instanceof CreatedEvent ||
    event instanceof UpdatedEvent ||
    event instanceof DeletedEvent) {
  // ... ✅ Type-safe
}
```

**3. No hay campos específicos del tipo:**

```typescript
// Eventos de eliminación deberían incluir:
// - deletedAt: Date
// - deletedBy: string
// - reason: string

// Pero cada evento lo implementa (o no) a su manera
```

#### ✅ Solución: Jerarquía de Tipos de Eventos

**Paso 1: Tipos Base**

```typescript
// shared/domain/events/domain-event.ts
export abstract class DomainEvent {
  static EVENT_NAME: string
  static VERSION: number

  readonly aggregateId: string
  readonly eventId: string
  readonly occurredOn: Date
  readonly eventName: string
  readonly version: number
  readonly metadata: DomainEventMetadata

  abstract toPrimitives(): DomainEventAttributes
}

// 🆕 Eventos de Creación
export abstract class CreatedEvent extends DomainEvent {
  readonly createdAt: Date
  readonly createdBy?: string

  constructor(params: DomainEventConstructor & {
    createdAt?: Date
    createdBy?: string
  }) {
    super(params)
    this.createdAt = params.createdAt || new Date()
    this.createdBy = params.createdBy
  }
}

// 🆕 Eventos de Actualización
export abstract class UpdatedEvent<T = any> extends DomainEvent {
  readonly updatedAt: Date
  readonly updatedBy?: string
  readonly changes: EventChanges<T>  // Qué cambió

  constructor(params: DomainEventConstructor & {
    updatedAt?: Date
    updatedBy?: string
    changes: EventChanges<T>
  }) {
    super(params)
    this.updatedAt = params.updatedAt || new Date()
    this.updatedBy = params.updatedBy
    this.changes = params.changes
  }
}

// 🆕 Eventos de Eliminación
export abstract class DeletedEvent extends DomainEvent {
  readonly deletedAt: Date
  readonly deletedBy: string
  readonly reason?: string
  readonly softDelete: boolean

  constructor(params: DomainEventConstructor & {
    deletedAt?: Date
    deletedBy: string
    reason?: string
    softDelete?: boolean
  }) {
    super(params)
    this.deletedAt = params.deletedAt || new Date()
    this.deletedBy = params.deletedBy
    this.reason = params.reason
    this.softDelete = params.softDelete ?? false
  }
}

// Helper type para cambios
export interface EventChanges<T> {
  previous: Partial<T>
  current: Partial<T>
}
```

**Paso 2: Usar en Eventos Concretos**

```typescript
// product-created.event.ts
export class ProductCreatedEvent extends CreatedEvent {  // 🆕 Hereda de CreatedEvent
  static readonly EVENT_NAME = 'product.created'
  static readonly VERSION = 1

  constructor(
    public readonly payload: ProductCreatedEventPayload,
    createdBy?: string,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductCreatedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductCreatedEvent.VERSION,
      createdBy,  // 🆕 Incluido automáticamente
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductCreatedEvent.VERSION,
      createdAt: this.createdAt.toISOString(),  // 🆕 De CreatedEvent
      createdBy: this.createdBy,                // 🆕 De CreatedEvent
      ...this.payload
    }
  }
}

// product-updated.event.ts
export class ProductUpdatedEvent extends UpdatedEvent<ProductPrimitives> {  // 🆕
  static readonly EVENT_NAME = 'product.updated'
  static readonly VERSION = 1

  constructor(
    public readonly payload: ProductUpdatedEventPayload,
    changes: EventChanges<ProductPrimitives>,  // 🆕 Qué cambió
    updatedBy?: string,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductUpdatedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductUpdatedEvent.VERSION,
      changes,     // 🆕
      updatedBy,   // 🆕
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductUpdatedEvent.VERSION,
      updatedAt: this.updatedAt.toISOString(),  // 🆕
      updatedBy: this.updatedBy,                // 🆕
      changes: this.changes,                    // 🆕
      ...this.payload
    }
  }
}

// product-deleted.event.ts
export class ProductDeletedEvent extends DeletedEvent {  // 🆕
  static readonly EVENT_NAME = 'product.deleted'
  static readonly VERSION = 1

  constructor(
    public readonly productId: string,
    deletedBy: string,            // 🆕 Requerido
    reason?: string,              // 🆕
    softDelete: boolean = true,   // 🆕
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductDeletedEvent.EVENT_NAME,
      aggregateId: productId,
      version: ProductDeletedEvent.VERSION,
      deletedBy,
      reason,
      softDelete,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductDeletedEvent.VERSION,
      productId: this.productId,
      deletedAt: this.deletedAt.toISOString(),  // 🆕
      deletedBy: this.deletedBy,                // 🆕
      reason: this.reason,                      // 🆕
      softDelete: this.softDelete               // 🆕
    }
  }
}
```

**Paso 3: Subscribers Genéricos**

```typescript
// shared/application/subscribers/audit-logger.subscriber.ts
@Injectable()
export class AuditLoggerSubscriber implements DomainEventSubscriber<DomainEvent> {
  subscribedTo(): DomainEventClass[] {
    // Este subscriber reacciona a TODOS los eventos
    return [DomainEvent as any]  // O registrar manualmente cada uno
  }

  async on(event: DomainEvent): Promise<void> {
    // 🆕 Lógica específica por tipo
    if (event instanceof CreatedEvent) {
      await this.logCreation(event)
    } else if (event instanceof UpdatedEvent) {
      await this.logUpdate(event)
    } else if (event instanceof DeletedEvent) {
      await this.logDeletion(event)
    }
  }

  private async logCreation(event: CreatedEvent): Promise<void> {
    console.log(`[AUDIT] ${event.eventName} created by ${event.createdBy} at ${event.createdAt}`)
  }

  private async logUpdate(event: UpdatedEvent): Promise<void> {
    console.log(`[AUDIT] ${event.eventName} updated by ${event.updatedBy}`)
    console.log('Changes:', JSON.stringify(event.changes, null, 2))
  }

  private async logDeletion(event: DeletedEvent): Promise<void> {
    console.log(
      `[AUDIT] ${event.eventName} ${event.softDelete ? 'soft-deleted' : 'permanently deleted'} by ${event.deletedBy}`
    )
    if (event.reason) {
      console.log(`Reason: ${event.reason}`)
    }
  }
}
```

**Paso 4: Uso en Agregado**

```typescript
export class Product extends AggregateRoot {
  delete(deletedBy: string, reason?: string): void {
    // Validar que se puede eliminar
    if (this.hasActiveOrders()) {
      throw new CannotDeleteProductWithActiveOrders(this.id.value)
    }

    // Registrar evento tipado
    this.record(
      new ProductDeletedEvent(
        this.id.value,
        deletedBy,        // ✅ Requerido
        reason,           // ✅ Opcional
        true              // ✅ Soft delete
      )
    )
  }

  update(
    data: UpdateProductData,
    updatedBy: string
  ): void {
    const previousState = this.toPrimitives()

    // Aplicar cambios
    this.name = new ProductName(data.name)
    this.price = new ProductPrice(data.price)
    // ...

    const currentState = this.toPrimitives()

    // Registrar evento con cambios
    this.record(
      new ProductUpdatedEvent(
        {
          productId: this.id.value,
          name: data.name,
          price: data.price,
          // ...
        },
        {
          previous: previousState,  // ✅ Estado anterior
          current: currentState     // ✅ Estado nuevo
        },
        updatedBy
      )
    )
  }
}
```

#### Beneficios

✅ **Semántica Clara:**
- `CreatedEvent` → Siempre tiene `createdBy`, `createdAt`
- `UpdatedEvent` → Siempre tiene `updatedBy`, `changes`
- `DeletedEvent` → Siempre tiene `deletedBy`, `reason`, `softDelete`

✅ **Subscribers Genéricos:**
```typescript
// Un solo subscriber para todas las creaciones
if (event instanceof CreatedEvent) {
  await sendWelcomeNotification(event)
}
```

✅ **Auditoría Automática:**
```typescript
// Query: Todos los cambios del usuario X
SELECT * FROM event_store
WHERE event_data->'metadata'->>'userId' = 'user-123'
  AND (
    event_data->>'createdBy' = 'user-123' OR
    event_data->>'updatedBy' = 'user-123' OR
    event_data->>'deletedBy' = 'user-123'
  )
```

✅ **Proyecciones Simplificadas:**
```typescript
// Read Model: "Historial de cambios"
class ChangeHistoryProjection {
  @OnEvent(UpdatedEvent)
  async handleUpdate(event: UpdatedEvent): Promise<void> {
    await this.repository.save({
      entityId: event.aggregateId,
      entityType: event.eventName.split('.')[0],
      changedBy: event.updatedBy,
      changes: event.changes,
      changedAt: event.updatedAt
    })
  }
}
```

---

### **10. 🟢 PROBLEMA: PersistDomainEventsSubscriber accede a propiedad privada con hack**

#### Problema

**Archivo:** [`src/shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts:74-78`](../../shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts#L74-L78)

```typescript
private async saveEventToStore(eventData: any): Promise<void> {
  // 🚨 HACK: Accede a propiedad privada con 'as any'
  const repository = (this.eventStoreService as any).eventStoreRepository
  await repository.save(eventData)
}
```

#### Problemas

**1. Viola Encapsulamiento:**
```typescript
export class EventStoreService {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly eventStoreRepository: Repository<EventStoreEntity>  // private!
  ) {}

  // No hay método público para guardar eventos directamente
}

// Subscriber se salta el encapsulamiento con 'as any'
```

**2. Frágil:**
```typescript
// Si EventStoreService cambia el nombre de la propiedad:
export class EventStoreService {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly repository: Repository<EventStoreEntity>  // 🆕 Renombrado
  ) {}
}

// 💥 PersistDomainEventsSubscriber rompe silenciosamente
// (this.eventStoreService as any).eventStoreRepository === undefined
```

**3. No Testeable:**
```typescript
// En tests, mockear es complicado:
const mockService = {
  eventStoreRepository: mockRepository  // 🚨 Necesitas saber internals
} as any
```

#### ✅ Solución: Exponer Método Público

**Paso 1: Agregar método público en EventStoreService**

```typescript
// shared/infrastructure/event-sourcing/event-store.service.ts
@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly eventStoreRepository: Repository<EventStoreEntity>
  ) {}

  // 🆕 Método público para guardar eventos
  async save(eventData: {
    aggregateId: string
    aggregateType: string
    eventType: string
    eventData: any
    metadata: any
    version: number
    occurredAt: Date
  }): Promise<void> {
    await this.eventStoreRepository.save(eventData)
  }

  // 🆕 Método público para buscar eventos
  async findByAggregateId(aggregateId: string): Promise<EventStoreEntity[]> {
    return this.eventStoreRepository.find({
      where: { aggregateId },
      order: { version: 'ASC' }
    })
  }

  // 🆕 Método público para buscar por tipo
  async findByEventType(eventType: string, limit?: number): Promise<EventStoreEntity[]> {
    return this.eventStoreRepository.find({
      where: { eventType },
      order: { occurredAt: 'DESC' },
      take: limit
    })
  }

  // 🆕 Método público para replay
  async findBetween(fromDate: Date, toDate: Date): Promise<EventStoreEntity[]> {
    return this.eventStoreRepository.find({
      where: {
        occurredAt: Between(fromDate, toDate)
      },
      order: { occurredAt: 'ASC' }
    })
  }
}
```

**Paso 2: Actualizar PersistDomainEventsSubscriber**

```typescript
// shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts
@Injectable()
export class PersistDomainEventsSubscriber {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @OnEvent('**', { async: true })
  async handleDomainEvent(event: DomainEvent): Promise<void> {
    try {
      if (!this.isDomainEvent(event)) {
        return
      }

      console.log(`[EventStore] Persisting event: ${event.eventName} for aggregate: ${event.aggregateId}`)

      const eventStoreEntity = {
        aggregateId: event.aggregateId,
        aggregateType: this.extractAggregateType(event.eventName),
        eventType: event.eventName,
        eventData: {
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          eventName: event.eventName,
          occurredOn: event.occurredOn,
          attributes: event.toPrimitives()
        },
        metadata: {
          timestamp: new Date(),
          source: 'domain-event'
        },
        version: 1,
        occurredAt: event.occurredOn
      }

      // ✅ Usar método público
      await this.eventStoreService.save(eventStoreEntity)
    } catch (error) {
      console.error(`[EventStore] Error persisting event ${event.eventName}:`, error)
    }
  }

  private isDomainEvent(event: any): event is DomainEvent {
    return (
      event &&
      typeof event === 'object' &&
      'eventName' in event &&
      'aggregateId' in event &&
      'eventId' in event &&
      'occurredOn' in event &&
      typeof event.toPrimitives === 'function'
    )
  }

  private extractAggregateType(eventName: string): string {
    const parts = eventName.split('.')
    return parts[0] || 'unknown'
  }
}
```

#### Beneficios

✅ **Encapsulamiento:**
- EventStoreService controla cómo se guardan eventos
- Puede agregar validación, transformación, etc.

✅ **Mantenibilidad:**
- Cambios internos no rompen subscribers
- Interfaz pública estable

✅ **Testeable:**
```typescript
// Test del subscriber
describe('PersistDomainEventsSubscriber', () => {
  it('should save event to store', async () => {
    const mockService = {
      save: jest.fn()  // ✅ Mock simple
    }

    const subscriber = new PersistDomainEventsSubscriber(mockService as any)

    await subscriber.handleDomainEvent(mockEvent)

    expect(mockService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: mockEvent.aggregateId,
        eventType: mockEvent.eventName
      })
    )
  })
})
```

✅ **Reutilizable:**
```typescript
// Otros casos de uso pueden usar el servicio
export class ReplayEvents {
  constructor(private readonly eventStore: EventStoreService) {}

  async run(aggregateId: string): Promise<void> {
    // ✅ Usar método público
    const events = await this.eventStore.findByAggregateId(aggregateId)

    // Reconstruir agregado desde eventos
    // ...
  }
}
```

---

## 🎯 Recomendaciones Priorizadas

### **🔴 Crítico (Hacerlo AHORA - Semana 1)**

**Estas son issues que rompen funcionalidad o violan principios fundamentales:**

#### 1. 🚨 Corregir bug en LowStockDetectedEvent constructor
**Archivo:** [`src/modules/inventory/domain/events/low-stock-detected.event.ts:19`](../../modules/inventory/domain/events/low-stock-detected.event.ts#L19)

**Problema:** Firma de `super()` incorrecta causa runtime error

**Acción:**
```typescript
// Cambiar de:
super(LowStockDetectedEvent.EVENT_NAME, eventId, occurredOn)

// A:
super({
  eventName: LowStockDetectedEvent.EVENT_NAME,
  aggregateId: payload.ingredientId,
  eventId,
  occurredOn
})
```

**Impacto:** ⚠️ **BLOQUEANTE** - Este código falla en runtime

**Esfuerzo:** 5 minutos

---

#### 2. 🚨 Estandarizar patrón de eventos (Payload vs Campos Individuales)
**Archivos:** Todos los eventos en [`src/modules/*/domain/events/`](../../modules/)

**Problema:** Dos patrones inconsistentes causan confusión y duplicación

**Acción:**
1. Definir patrón estándar (recomendado: Patrón B con Payload)
2. Crear template/generator de eventos
3. Migrar eventos existentes gradualmente

**Impacto:** 🟡 **MEDIO** - No rompe nada, pero dificulta mantenimiento

**Esfuerzo:** 1-2 días (incluye refactor)

**Prioridad:** Alta (establecer estándar antes de agregar más módulos)

---

#### 3. 🚨 Exponer método público en EventStoreService
**Archivo:** [`src/shared/infrastructure/event-sourcing/event-store.service.ts`](../../shared/infrastructure/event-sourcing/event-store.service.ts)

**Problema:** Hack con `as any` viola encapsulamiento

**Acción:**
```typescript
// Agregar en EventStoreService
async save(eventData: EventStoreEntityData): Promise<void> {
  await this.eventStoreRepository.save(eventData)
}

// Actualizar PersistDomainEventsSubscriber
await this.eventStoreService.save(eventStoreEntity)  // Usar método público
```

**Impacto:** 🟢 **BAJO** - Mejora arquitectura, no rompe nada

**Esfuerzo:** 30 minutos

---

### **🟡 Importante (Siguientes 2-4 semanas)**

**Características enterprise necesarias para producción:**

#### 4. 🆕 Agregar eventos faltantes en Product aggregate
**Archivo:** [`src/modules/products/domain/product.ts`](../../modules/products/domain/product.ts)

**Problema:** Métodos como `updatePrice()`, `activate()`, `deactivate()` no emiten eventos

**Acción:**
1. Crear eventos:
   - `ProductPriceChangedEvent`
   - `ProductActivatedEvent`
   - `ProductDeactivatedEvent`
   - `ProductTagAddedEvent`
   - `ProductTagRemovedEvent`
   - `ProductImageUpdatedEvent`
   - `ProductImageRemovedEvent`

2. Actualizar métodos del agregado:
```typescript
updatePrice(newPrice: number, changedBy?: string): void {
  const previousPrice = this.price.value
  this.price = new ProductPrice(newPrice)

  this.record(new ProductPriceChangedEvent({
    productId: this.id.value,
    previousPrice,
    newPrice,
    changedBy
  }))
}
```

**Impacto:** 🔴 **ALTO** - Auditoría y trazabilidad completa

**Esfuerzo:** 1-2 días

---

#### 5. 🆕 Agregar metadatos contextuales (userId, correlationId, causationId)
**Archivo:** [`src/shared/domain/events/domain-event.ts`](./domain-event.ts)

**Problema:** Eventos no capturan contexto de ejecución

**Acción:**
1. Extender `DomainEventConstructor`:
```typescript
export interface DomainEventMetadata {
  userId?: string
  userName?: string
  correlationId?: string
  causationId?: string
  ipAddress?: string
  // ...
}

export interface DomainEventConstructor {
  eventName: string
  aggregateId: string
  eventId?: string
  occurredOn?: Date
  metadata?: DomainEventMetadata  // 🆕
}
```

2. Actualizar use cases para pasar contexto
3. Actualizar EventStore para persistir metadata

**Impacto:** 🔴 **ALTO** - Auditoría enterprise-grade

**Esfuerzo:** 2-3 días

---

#### 6. 🆕 Implementar versionado de eventos
**Archivo:** [`src/shared/domain/events/domain-event.ts`](./domain-event.ts)

**Problema:** No hay versión explícita, imposible evolucionar schemas

**Acción:**
1. Agregar campo `version`:
```typescript
export abstract class DomainEvent {
  static VERSION: number  // 🆕
  readonly version: number  // 🆕
}
```

2. Incluir version en `toPrimitives()`
3. Crear sistema de upcasting (ver sección 6)

**Impacto:** 🟡 **MEDIO** - Crítico para largo plazo

**Esfuerzo:** 3-4 días (incluye upcaster)

---

#### 7. 🔧 Mejorar manejo de errores (Logger + Retry + Dead-Letter Queue)
**Archivo:** [`src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts`](../../shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts)

**Problema:** Errores solo se logean con `console.error`, no hay retry ni dead-letter

**Acción:**
1. Implementar Logger estructurado (Winston/Pino)
2. Implementar RetryHandler con exponential backoff
3. Implementar DeadLetterQueueService
4. Actualizar EventBus (ver sección 5)

**Impacto:** 🔴 **ALTO** - Resiliencia en producción

**Esfuerzo:** 4-5 días

---

### **🟢 Mejora continua (Backlog - Próximos meses)**

**Optimizaciones y features avanzadas:**

#### 8. 🚀 Implementar Transactional Outbox Pattern
**Archivo:** [`src/shared/infrastructure/event-bus/`](../../shared/infrastructure/event-bus/)

**Problema:** EventBus publica eventos sin garantías transaccionales

**Acción:**
1. Crear tabla `outbox`
2. Implementar `OutboxRepository`
3. Implementar `TransactionalEventBus`
4. Implementar `OutboxWorkerService` (polling cada 1s)
5. Configurar con `@Cron` (ver sección 8)

**Impacto:** 🔴 **ALTO** - Garantía de entrega at-least-once

**Esfuerzo:** 5-7 días

---

#### 9. 🎨 Agregar tipos semánticos de eventos (CreatedEvent, UpdatedEvent, DeletedEvent)
**Archivo:** [`src/shared/domain/events/domain-event.ts`](./domain-event.ts)

**Problema:** No hay jerarquía semántica, dificulta subscribers genéricos

**Acción:**
1. Crear clases base:
   - `CreatedEvent` (con `createdBy`, `createdAt`)
   - `UpdatedEvent<T>` (con `updatedBy`, `changes`)
   - `DeletedEvent` (con `deletedBy`, `reason`, `softDelete`)

2. Migrar eventos existentes a heredar de tipos semánticos

**Impacto:** 🟢 **BAJO** - Nice to have, no bloqueante

**Esfuerzo:** 2-3 días

---

#### 10. 🔒 Validación de schemas con Zod en `fromPrimitives()`
**Archivos:** Todos los eventos

**Problema:** Castings inseguros sin validación

**Acción:**
1. Instalar Zod
2. Definir schemas para cada payload:
```typescript
const ProductCreatedEventPayloadSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  // ...
})
```

3. Validar en `fromPrimitives()`:
```typescript
const validated = ProductCreatedEventPayloadSchema.parse(attributes)
```

**Impacto:** 🟡 **MEDIO** - Type safety en runtime

**Esfuerzo:** 3-4 días (todos los eventos)

---

#### 11. 📊 Implementar Event Store Query API
**Archivo:** Nuevo módulo `shared/infrastructure/event-sourcing/queries/`

**Problema:** No hay API para queries complejas de Event Store

**Acción:**
1. Implementar query builders:
```typescript
await eventStore.query()
  .byAggregateType('product')
  .byEventType('product.price_changed')
  .between(startDate, endDate)
  .withMetadata({ userId: 'user-123' })
  .execute()
```

2. Agregar índices en Event Store para performance

**Impacto:** 🟢 **BAJO** - Mejora developer experience

**Esfuerzo:** 2-3 días

---

#### 12. 📈 Implementar Event Store Analytics Dashboard
**Archivo:** Nuevo módulo `modules/analytics/`

**Problema:** No hay visibilidad de eventos en el sistema

**Acción:**
1. Crear endpoint `/analytics/events`
2. Queries útiles:
   - Top eventos por tipo
   - Throughput por minuto/hora
   - Latencia de procesamiento
   - Tasa de fallos

**Impacto:** 🟢 **BAJO** - Observabilidad

**Esfuerzo:** 3-4 días

---

## 📝 Plan de Implementación

### **Sprint 1 (Semana 1): Fixes Críticos**

**Objetivo:** Corregir bugs y violaciones arquitectónicas

- [ ] **Día 1:** Corregir `LowStockDetectedEvent` constructor bug
- [ ] **Día 2:** Exponer método público en `EventStoreService`
- [ ] **Día 3-5:** Estandarizar patrón de eventos (elegir Payload, documentar, crear template)

**Entregables:**
- ✅ Todos los eventos usan firma correcta de `super()`
- ✅ No más hacks con `as any`
- ✅ Guía de estilo documentada en CLAUDE.md

---

### **Sprint 2-3 (Semanas 2-3): Eventos y Metadata**

**Objetivo:** Completar eventos faltantes y agregar contexto

- [ ] **Semana 2:**
  - Crear eventos faltantes en Product (`ProductPriceChanged`, `ProductActivated`, etc.)
  - Actualizar métodos del agregado para registrar eventos
  - Tests unitarios

- [ ] **Semana 3:**
  - Agregar metadata contextuales a `DomainEvent`
  - Actualizar use cases para pasar `userId`, `correlationId`
  - Actualizar Event Store schema para metadata

**Entregables:**
- ✅ 100% de operaciones de dominio emiten eventos
- ✅ Eventos incluyen contexto de ejecución (who, when, why)

---

### **Sprint 4-5 (Semanas 4-5): Resiliencia y Versionado**

**Objetivo:** Manejo de errores robusto y evolución de schemas

- [ ] **Semana 4:**
  - Implementar Logger estructurado (Winston)
  - Implementar RetryHandler con exponential backoff
  - Implementar DeadLetterQueueService
  - Actualizar EventBus con retry logic

- [ ] **Semana 5:**
  - Agregar campo `version` a eventos
  - Implementar EventUpcasterService
  - Crear upcasters para eventos existentes (si es necesario)
  - Tests de backward compatibility

**Entregables:**
- ✅ Sistema de logging estructurado con Datadog/Sentry
- ✅ Retry automático en fallos transitorios
- ✅ Dead-letter queue para eventos fallidos
- ✅ Versionado de eventos con upcasting

---

### **Sprint 6-7 (Semanas 6-8): Transactional Outbox**

**Objetivo:** Garantía de entrega de eventos

- [ ] **Semana 6:**
  - Crear tabla `outbox`
  - Implementar `OutboxRepository`
  - Implementar `TransactionalEventBus`

- [ ] **Semana 7:**
  - Implementar `OutboxWorkerService` con polling
  - Configurar con `@Cron`
  - Tests de integración

- [ ] **Semana 8:**
  - Monitorear en staging
  - Ajustar polling frequency
  - Dashboard de outbox health

**Entregables:**
- ✅ EventBus transaccional (at-least-once delivery)
- ✅ Worker de outbox con retry automático
- ✅ Dashboard de salud del sistema

---

### **Backlog (Próximos 3-6 meses)**

**Objetivos:** Optimizaciones y features avanzadas

- [ ] **Q1 2026:**
  - Tipos semánticos de eventos (`CreatedEvent`, `UpdatedEvent`, `DeletedEvent`)
  - Validación con Zod en todos los eventos
  - Event Store Query API

- [ ] **Q2 2026:**
  - Analytics Dashboard
  - Event sourcing completo (rebuild aggregates from events)
  - Snapshotting para performance

---

## 💡 Código de Ejemplo Mejorado

### **Evento Completo con Todas las Best Practices**

```typescript
// src/modules/products/domain/events/product-price-changed.event.ts
import { z } from 'zod'
import { DomainEvent, DomainEventAttributes, DomainEventMetadata } from '@/shared/domain/events'

// 🆕 Schema de validación con Zod
const ProductPriceChangedPayloadSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  previousPrice: z.number().positive(),
  newPrice: z.number().positive(),
  priceChangePercentage: z.number(),
  currency: z.string().length(3),  // ISO 4217
  changedAt: z.date(),
  changedBy: z.string().optional(),
  reason: z.enum(['promotion', 'cost_increase', 'manual', 'automatic']).optional()
})

// 🆕 Type inference desde Zod
export type ProductPriceChangedPayload = z.infer<typeof ProductPriceChangedPayloadSchema>

export class ProductPriceChangedEvent extends DomainEvent {
  // 🆕 Nombre del evento semántico
  static readonly EVENT_NAME = 'product.price_changed'

  // 🆕 Versión explícita
  static readonly VERSION = 1

  constructor(
    public readonly payload: ProductPriceChangedPayload,
    metadata?: DomainEventMetadata,  // 🆕 Metadata opcional
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductPriceChangedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductPriceChangedEvent.VERSION,  // 🆕
      metadata,  // 🆕
      eventId,
      occurredOn
    })
  }

  toPrimitives(): DomainEventAttributes {
    return {
      version: ProductPriceChangedEvent.VERSION,  // 🆕 Incluir versión
      ...this.payload,
      changedAt: this.payload.changedAt.toISOString()
    }
  }

  static fromPrimitives(params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    attributes: DomainEventAttributes
    metadata?: DomainEventMetadata  // 🆕
  }): ProductPriceChangedEvent {
    try {
      // 🆕 Validación con Zod
      const validated = ProductPriceChangedPayloadSchema.parse({
        ...params.attributes,
        changedAt: new Date(params.attributes.changedAt as string)
      })

      return new ProductPriceChangedEvent(
        validated,
        params.metadata,
        params.eventId,
        params.occurredOn
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new EventDeserializationException(
          `Failed to deserialize ${ProductPriceChangedEvent.EVENT_NAME}`,
          {
            eventId: params.eventId,
            aggregateId: params.aggregateId,
            validationErrors: error.errors
          }
        )
      }
      throw error
    }
  }
}
```

### **Agregado Emitiendo Evento Completo**

```typescript
// src/modules/products/domain/product.ts
export class Product extends AggregateRoot {
  updatePrice(
    newPrice: number,
    context: {
      userId: string
      userName: string
      correlationId: string
      reason?: 'promotion' | 'cost_increase' | 'manual' | 'automatic'
    }
  ): void {
    // Validar cambio de precio
    if (newPrice === this.price.value) {
      return  // No hay cambio
    }

    const previousPrice = this.price.value

    // Aplicar cambio
    this.price = new ProductPrice(newPrice)
    this.updatedAt = new Date()

    // Calcular porcentaje de cambio
    const priceChangePercentage = ((newPrice - previousPrice) / previousPrice) * 100

    // 🆕 Registrar evento completo con contexto
    this.record(
      new ProductPriceChangedEvent(
        {
          productId: this.id.value,
          productName: this.name.value,
          previousPrice,
          newPrice,
          priceChangePercentage,
          currency: 'PEN',  // O desde configuración
          changedAt: new Date(),
          changedBy: context.userId,
          reason: context.reason
        },
        {
          userId: context.userId,
          userName: context.userName,
          correlationId: context.correlationId,
          causationId: undefined  // Este es el evento raíz
        }
      )
    )
  }
}
```

### **Use Case con Contexto**

```typescript
// src/modules/products/application/update-price/update-product-price.ts
export class UpdateProductPrice {
  constructor(
    private readonly repository: ProductRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    productId: string,
    newPrice: number,
    context: {
      userId: string
      userName: string
      correlationId: string
      reason?: 'promotion' | 'cost_increase' | 'manual' | 'automatic'
    }
  ): Promise<void> {
    // Buscar producto
    const product = await this.repository.findById(new ProductId(productId))
    if (!product) {
      throw new ProductNotFound(productId)
    }

    // Actualizar precio (registra evento internamente)
    product.updatePrice(newPrice, context)

    // Guardar cambios
    await this.repository.save(product)

    // Publicar eventos
    const events = product.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
```

### **Subscriber con Manejo de Errores**

```typescript
// src/modules/products/application/subscribers/invalidate-cache-on-price-changed.subscriber.ts
@Injectable()
export class InvalidateCacheOnPriceChangedSubscriber
  implements DomainEventSubscriber<ProductPriceChangedEvent>
{
  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [ProductPriceChangedEvent]
  }

  async on(event: ProductPriceChangedEvent): Promise<void> {
    const context = {
      eventId: event.eventId,
      productId: event.payload.productId,
      correlationId: event.metadata.correlationId,
      userId: event.metadata.userId
    }

    this.logger.info('Invalidating cache for product price change', context)

    try {
      // Invalidar cache de producto
      await this.cacheService.delete(`product:${event.payload.productId}`)

      // Invalidar cache de lista de productos
      await this.cacheService.delete('products:list')

      this.logger.info('Cache invalidated successfully', context)
    } catch (error) {
      this.logger.error('Failed to invalidate cache', context, error as Error)

      // Lanzar error para que RetryHandler lo maneje
      throw error
    }
  }
}
```

---

## 📚 Referencias y Recursos

### **Libros**

- **Domain-Driven Design** - Eric Evans (2003)
- **Implementing Domain-Driven Design** - Vaughn Vernon (2013)
- **Versioning in an Event Sourced System** - Greg Young (2010)

### **Artículos**

- [The Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html) - Chris Richardson
- [Event Versioning Strategies](https://leanpub.com/esversioning/read) - Greg Young
- [CQRS and Event Sourcing](https://martinfowler.com/bliki/CQRS.html) - Martin Fowler

### **Implementaciones de Referencia**

- [CodelyTV (PHP)](https://github.com/CodelyTV/php-ddd-example) - Patrón que sigue este proyecto
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs) - Documentación oficial
- [EventStoreDB](https://www.eventstore.com/) - Event Store especializado

---

**Última Actualización:** 2025-11-03
**Autor:** Claude (Anthropic) + Análisis de Codebase
**Próxima Revisión:** Después de implementar Sprint 1
