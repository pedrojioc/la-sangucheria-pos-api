# Domain Services en Arquitectura Onion - Guía Completa

## ¿Qué son los Domain Services?

### Definición de Eric Evans (DDD Blue Book)

> **"A Domain Service is a stateless operation that fulfills a domain-specific task. Use it when an operation doesn't naturally belong to any Entity or Value Object."**

### Características Clave

1. **Stateless** (sin estado): No mantienen datos entre llamadas
2. **Pura lógica de dominio**: Resuelven problemas del negocio
3. **No pertenecen a una entidad**: La operación involucra múltiples agregados o conceptos
4. **Expresan el lenguaje ubicuo**: Nombres del dominio, no técnicos

---

## Domain Services vs Application Services vs Infrastructure Services

Esta es la **confusión #1** en DDD. Hay 3 tipos diferentes de servicios:

| Tipo | Capa | Propósito | Ejemplo |
|------|------|-----------|---------|
| **Domain Service** | Domain | Lógica de negocio que no encaja en entidades | `PricingService`, `TransferMoneyService` |
| **Application Service (Use Case)** | Application | Orquestación de casos de uso | `CreateOrderUseCase`, `ProcessPayment` |
| **Infrastructure Service** | Infrastructure | Detalles técnicos (DB, APIs, etc.) | `EmailService`, `S3StorageService` |

### Comparación Visual

```
┌─────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (Pure Business Logic)                     │
│                                                         │
│  ┌──────────────┐      ┌──────────────────┐           │
│  │  Aggregate   │      │  Domain Service  │           │
│  │  (Entity)    │      │                  │           │
│  │              │      │  - Stateless     │           │
│  │  Order       │ ───> │  - Pure logic    │           │
│  │  Product     │      │  - Multi-entity  │           │
│  └──────────────┘      └──────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↑
                          │ uses
┌─────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Orchestration)                       │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │  Application Service (Use Case)      │              │
│  │                                       │              │
│  │  CreateOrder {                        │              │
│  │    1. Validate input                  │              │
│  │    2. Load aggregates from repos      │              │
│  │    3. Call domain service             │ ← Orchestrates│
│  │    4. Save aggregates                 │              │
│  │    5. Publish events                  │              │
│  │  }                                     │              │
│  └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↑
                          │ uses
┌─────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER (Technical Details)                │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │  Infrastructure Service              │              │
│  │                                       │              │
│  │  - EmailService (sends emails)       │              │
│  │  - S3StorageService (saves files)    │              │
│  │  - PaymentGateway (Stripe API)       │              │
│  └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ¿Cuándo Usar un Domain Service?

### Test de Eric Evans: "The Entity Test"

Hazte estas preguntas:

1. **¿La operación es un concepto importante del dominio?**
   - ✅ SÍ → Candidato a Domain Service
   - ❌ NO → Probablemente Application Service

2. **¿La operación no pertenece naturalmente a ninguna entidad?**
   - ✅ SÍ → Domain Service
   - ❌ NO → Método del agregado

3. **¿La operación involucra múltiples agregados?**
   - ✅ SÍ → Domain Service
   - ❌ NO → Método del agregado o Use Case

4. **¿La operación requiere lógica compleja de negocio?**
   - ✅ SÍ → Domain Service
   - ❌ NO → Use Case simple

### Señales de que Necesitas un Domain Service

✅ **USA Domain Service cuando:**
- La operación involucra **múltiples agregados** de diferentes tipos
- La lógica **no pertenece conceptualmente** a ningún agregado
- Es un **concepto del dominio** con nombre en el lenguaje ubicuo
- La lógica es **compleja** y necesita ser testeada aisladamente
- Necesitas **reutilizar** la lógica en múltiples use cases

❌ **NO USES Domain Service cuando:**
- La operación pertenece claramente a un agregado (método del agregado)
- Es solo orquestación sin lógica de negocio (use case)
- Es infraestructura técnica (infrastructure service)
- Solo se usa en un lugar (inline en use case)

---

## Ejemplos Prácticos

### Ejemplo 1: Transfer Money (Clásico de DDD)

**❌ INCORRECTO: Lógica en la entidad**

```typescript
// ¿En qué agregado va esta lógica?
export class BankAccount extends AggregateRoot {
  transferTo(targetAccount: BankAccount, amount: Money) {
    // ❌ Problema: BankAccount no debería conocer otro BankAccount
    this.balance = this.balance.subtract(amount)
    targetAccount.balance = targetAccount.balance.add(amount)
  }
}
```

**✅ CORRECTO: Domain Service**

```typescript
// domain/services/transfer-money.service.ts
export class TransferMoneyService {
  transfer(
    sourceAccount: BankAccount,
    targetAccount: BankAccount,
    amount: Money
  ): void {
    // Validaciones de dominio
    if (!sourceAccount.canWithdraw(amount)) {
      throw new InsufficientFundsException()
    }

    if (!targetAccount.canReceive(amount)) {
      throw new AccountLimitExceededException()
    }

    // Lógica de transferencia
    sourceAccount.withdraw(amount)
    targetAccount.deposit(amount)

    // Eventos de dominio
    sourceAccount.record(new MoneyWithdrawnEvent(...))
    targetAccount.record(new MoneyDepositedEvent(...))
  }
}

// Agregados tienen métodos simples
export class BankAccount extends AggregateRoot {
  withdraw(amount: Money): void {
    this.balance = this.balance.subtract(amount)
  }

  deposit(amount: Money): void {
    this.balance = this.balance.add(amount)
  }

  canWithdraw(amount: Money): boolean {
    return this.balance.isGreaterThanOrEqual(amount)
  }
}
```

**Application Service (Use Case) usa Domain Service:**

```typescript
// application/transfer-money/transfer-money.ts
export class TransferMoney {
  constructor(
    private readonly accountRepo: BankAccountRepository,
    private readonly transferService: TransferMoneyService,  // ← Domain Service
    private readonly eventBus: EventBus
  ) {}

  async run(
    sourceAccountId: string,
    targetAccountId: string,
    amount: number
  ): Promise<void> {
    // 1. Cargar agregados
    const sourceAccount = await this.accountRepo.findById(sourceAccountId)
    const targetAccount = await this.accountRepo.findById(targetAccountId)

    if (!sourceAccount || !targetAccount) {
      throw new AccountNotFoundException()
    }

    // 2. Llamar Domain Service (lógica de negocio)
    this.transferService.transfer(
      sourceAccount,
      targetAccount,
      new Money(amount)
    )

    // 3. Persistir agregados
    await this.accountRepo.save(sourceAccount)
    await this.accountRepo.save(targetAccount)

    // 4. Publicar eventos
    await this.eventBus.publish([
      ...sourceAccount.pullDomainEvents(),
      ...targetAccount.pullDomainEvents()
    ])
  }
}
```

---

### Ejemplo 2: Pricing Service (E-commerce)

**Escenario:** Calcular precio final considerando producto, categoría, cliente, promociones.

```typescript
// domain/services/pricing.service.ts
export class PricingService {
  calculateFinalPrice(
    product: Product,
    customer: Customer,
    promotions: Promotion[]
  ): Money {
    let price = product.basePrice

    // Descuento por categoría de producto
    if (product.category.hasDiscount()) {
      price = price.applyDiscount(product.category.discountPercentage)
    }

    // Descuento por tipo de cliente (VIP, Regular)
    if (customer.isVIP()) {
      price = price.applyDiscount(new Percentage(10))
    }

    // Aplicar promociones activas
    const activePromotions = promotions.filter(p =>
      p.isActive() && p.appliesTo(product)
    )

    for (const promotion of activePromotions) {
      price = promotion.applyTo(price)
    }

    return price
  }
}
```

**Por qué es Domain Service:**
- ✅ Involucra múltiples agregados (`Product`, `Customer`, `Promotion`)
- ✅ Es lógica de negocio compleja
- ✅ "Calcular precio" es concepto del dominio
- ✅ Se reutiliza en múltiples use cases (crear orden, cotización, carrito)

---

### Ejemplo 3: Recipe Validation (POS System)

**Escenario:** Validar que una receta tenga ingredientes válidos y cantidades correctas.

```typescript
// domain/services/recipe-validation.service.ts
export class RecipeValidationService {
  validate(
    recipe: Recipe,
    ingredients: Ingredient[]
  ): ValidationResult {
    const errors: string[] = []

    // Validar que todos los ingredientes existen
    const ingredientMap = new Map(ingredients.map(i => [i.id.value, i]))

    for (const recipeItem of recipe.items) {
      const ingredient = ingredientMap.get(recipeItem.ingredientId.value)

      if (!ingredient) {
        errors.push(`Ingredient ${recipeItem.ingredientId.value} not found`)
        continue
      }

      // Validar que las unidades coincidan
      if (!ingredient.unitId.equals(recipeItem.unitId)) {
        errors.push(
          `Unit mismatch for ${ingredient.name.value}: ` +
          `expected ${ingredient.unitId.value}, got ${recipeItem.unitId.value}`
        )
      }

      // Validar cantidad mínima
      if (recipeItem.quantity.isLessThan(new Quantity(0.001))) {
        errors.push(`Quantity too small for ${ingredient.name.value}`)
      }
    }

    return new ValidationResult(errors)
  }
}
```

**Uso en Use Case:**

```typescript
// application/create-recipe/create-recipe.ts
export class CreateRecipe {
  constructor(
    private readonly recipeRepo: RecipeRepository,
    private readonly ingredientRepo: IngredientRepository,
    private readonly validationService: RecipeValidationService,  // ← Domain Service
    private readonly eventBus: EventBus
  ) {}

  async run(data: RecipeData): Promise<void> {
    // 1. Cargar ingredientes
    const ingredients = await this.ingredientRepo.findByIds(data.ingredientIds)

    // 2. Crear receta (agregado)
    const recipe = Recipe.create(data)

    // 3. Validar con Domain Service
    const validation = this.validationService.validate(recipe, ingredients)

    if (!validation.isValid()) {
      throw new InvalidRecipeException(validation.errors)
    }

    // 4. Guardar
    await this.recipeRepo.save(recipe)
    await this.eventBus.publish(recipe.pullDomainEvents())
  }
}
```

---

## Domain Service vs Aggregate Method

### Regla de Vaughn Vernon

> **"If the behavior is intrinsic to the Aggregate, it goes in the Aggregate. If it coordinates multiple Aggregates, it goes in a Domain Service."**

### Ejemplo Comparativo

**✅ Método del Agregado (pertenece a la entidad):**

```typescript
export class Order extends AggregateRoot {
  // ✅ CORRECTO: Lógica intrinseca de Order
  addItem(product: Product, quantity: Quantity): void {
    const item = OrderItem.create(product.id, quantity, product.price)
    this.items.push(item)
    this.recalculateTotal()  // ← Lógica interna del agregado
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero()
    )
  }
}
```

**✅ Domain Service (coordina múltiples agregados):**

```typescript
export class OrderFulfillmentService {
  // ✅ CORRECTO: Coordina Order + Inventory + Shipping
  fulfill(
    order: Order,
    inventory: Inventory,
    shippingAddress: Address
  ): Shipment {
    // Validar stock
    for (const item of order.items) {
      if (!inventory.hasStock(item.productId, item.quantity)) {
        throw new OutOfStockException()
      }
    }

    // Reservar inventario
    for (const item of order.items) {
      inventory.reserve(item.productId, item.quantity)
    }

    // Crear shipment
    const shipment = Shipment.create(order.id, shippingAddress, order.items)

    // Marcar orden como fulfilled
    order.markAsFulfilled()

    return shipment
  }
}
```

---

## Estructura de Archivos

```
src/contexts/[module]/
├── domain/
│   ├── [aggregate].ts                    # Agregados
│   ├── [value-objects].ts                # Value Objects
│   ├── repositories/                     # Interfaces de repositorios
│   │   └── [aggregate].repository.ts
│   │
│   └── services/                         # ← Domain Services
│       ├── pricing.service.ts
│       ├── recipe-validation.service.ts
│       └── transfer-money.service.ts
│
├── application/
│   └── [use-case]/
│       ├── [use-case].ts                 # Use Case (orquestación)
│       ├── [use-case].command.ts
│       └── [use-case].handler.ts
│
└── infrastructure/
    ├── persistence/
    │   └── typeorm/
    │       └── typeorm-[aggregate].repository.ts
    │
    └── services/                         # ← Infrastructure Services
        ├── email.service.ts
        ├── s3-storage.service.ts
        └── stripe-payment.service.ts
```

---

## Domain Services: Características Técnicas

### 1. **Stateless (Sin Estado)**

```typescript
// ✅ CORRECTO: Stateless
export class PricingService {
  calculatePrice(product: Product, customer: Customer): Money {
    // No tiene estado interno
    // Solo recibe parámetros y retorna resultado
  }
}

// ❌ INCORRECTO: Stateful
export class PricingService {
  private lastCalculatedPrice: Money  // ❌ Estado interno

  calculatePrice(product: Product): Money {
    this.lastCalculatedPrice = product.price  // ❌ Muta estado
    return this.lastCalculatedPrice
  }
}
```

### 2. **Inyección de Dependencias**

```typescript
// Domain Service puede depender de:
// - Otros Domain Services
// - Factories
// - NO debe depender de repositorios (eso es responsabilidad del Use Case)

export class RecipeValidationService {
  constructor(
    private readonly pricingService: PricingService  // ✅ Otro domain service
  ) {}

  validate(recipe: Recipe, ingredients: Ingredient[]): ValidationResult {
    // Puede usar otro domain service
    const totalCost = this.pricingService.calculateRecipeCost(recipe, ingredients)
    // ...
  }
}
```

### 3. **Registro en el Módulo (NestJS)**

```typescript
// ingredient.module.ts
@Module({
  providers: [
    // Domain Services (NO usan @Injectable en su definición)
    RecipeValidationService,
    PricingService,

    // Use Cases
    CreateRecipeUseCase,

    // Handlers
    CreateRecipeHandler,

    // Repositories
    {
      provide: IngredientRepository,
      useClass: TypeOrmIngredientRepository
    }
  ]
})
export class IngredientModule {}
```

**Nota:** Domain Services **NO llevan decorator `@Injectable()`** si sigues DDD puro (porque son capa de dominio, sin framework). Pero en NestJS pragmático, puedes agregarlo para DI.

---

## Casos Reales en Proyectos POS

### Caso 1: **Inventory Adjustment Service**

```typescript
// domain/services/inventory-adjustment.service.ts
export class InventoryAdjustmentService {
  adjust(
    ingredient: Ingredient,
    adjustment: StockAdjustment,
    reason: AdjustmentReason
  ): InventoryMovement {
    // Validaciones de negocio
    if (adjustment.isNegative() && ingredient.currentStock.isLessThan(adjustment.absolute())) {
      throw new InsufficientStockException()
    }

    // Calcular nuevo stock
    const newStock = ingredient.currentStock.add(adjustment)

    // Verificar alertas
    if (newStock.isLessThan(ingredient.minimumStock)) {
      ingredient.record(new LowStockAlertEvent(...))
    }

    // Crear movimiento de inventario
    return InventoryMovement.create({
      ingredientId: ingredient.id,
      adjustment,
      reason,
      previousStock: ingredient.currentStock,
      newStock
    })
  }
}
```

### Caso 2: **Order Pricing Service**

```typescript
// domain/services/order-pricing.service.ts
export class OrderPricingService {
  calculateTotal(
    orderItems: OrderItem[],
    customer: Customer,
    promotions: Promotion[]
  ): OrderTotal {
    let subtotal = Money.zero()

    // Calcular subtotal
    for (const item of orderItems) {
      subtotal = subtotal.add(item.price.multiply(item.quantity))
    }

    // Aplicar descuentos
    let discount = Money.zero()

    if (customer.hasLoyaltyDiscount()) {
      discount = subtotal.applyPercentage(customer.loyaltyPercentage)
    }

    // Aplicar promociones
    for (const promo of promotions) {
      if (promo.appliesTo(orderItems)) {
        discount = discount.add(promo.calculateDiscount(subtotal))
      }
    }

    // Calcular impuestos
    const taxable = subtotal.subtract(discount)
    const tax = taxable.applyPercentage(new Percentage(18))  // IGV Perú

    return new OrderTotal({
      subtotal,
      discount,
      tax,
      total: taxable.add(tax)
    })
  }
}
```

---

## Anti-Patterns (Qué NO Hacer)

### ❌ Anti-Pattern 1: "Anemic Domain Service"

```typescript
// ❌ INCORRECTO: Solo delega a repositorio (debería ser Use Case)
export class IngredientService {
  constructor(private readonly repo: IngredientRepository) {}

  async findById(id: string): Promise<Ingredient> {
    return this.repo.findById(new IngredientId(id))  // ❌ No aporta lógica
  }

  async save(ingredient: Ingredient): Promise<void> {
    return this.repo.save(ingredient)  // ❌ Solo CRUD
  }
}
```

**Esto NO es Domain Service, es un Use Case mal nombrado o wrapper innecesario.**

### ❌ Anti-Pattern 2: "God Service"

```typescript
// ❌ INCORRECTO: Hace todo (viola SRP)
export class IngredientService {
  createIngredient() { }
  updateIngredient() { }
  deleteIngredient() { }
  validateIngredient() { }
  calculateIngredientCost() { }
  checkIngredientStock() { }
  // ... 20 métodos más
}
```

**Divide en múltiples Domain Services especializados.**

### ❌ Anti-Pattern 3: "Infrastructure in Domain Service"

```typescript
// ❌ INCORRECTO: Domain Service con dependencias de infraestructura
export class OrderService {
  constructor(
    private readonly emailService: EmailService,  // ❌ Infra
    private readonly paymentGateway: StripeService  // ❌ Infra
  ) {}

  processOrder(order: Order): void {
    this.emailService.send(...)  // ❌ No pertenece al dominio
    this.paymentGateway.charge(...)  // ❌ No pertenece al dominio
  }
}
```

**Esto debería ser un Use Case, no Domain Service.**

---

## Resumen: Cuándo Usar Qué

| Concepto | Responsabilidad | Ejemplo |
|----------|----------------|---------|
| **Aggregate Method** | Lógica intrinseca de la entidad | `order.addItem()` |
| **Domain Service** | Lógica de negocio multi-agregado | `PricingService.calculateTotal()` |
| **Use Case (Application Service)** | Orquestación del flujo | `CreateOrder.run()` |
| **Infrastructure Service** | Detalles técnicos externos | `EmailService.send()` |

---

## Referencias

1. **Eric Evans** - "Domain-Driven Design" (2003), Chapter 5: Services
2. **Vaughn Vernon** - "Implementing Domain-Driven Design" (2013), Chapter 7: Services
3. **Martin Fowler** - [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
4. **Greg Young** - CQRS Documents
5. **Udi Dahan** - [Clarified CQRS](https://udidahan.com/2009/12/09/clarified-cqrs/)

---

**Última actualización:** 2025-11-17
