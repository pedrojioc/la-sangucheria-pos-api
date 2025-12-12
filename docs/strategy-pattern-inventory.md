# 🎯 Strategy Pattern en Products: RECIPE vs DIRECT

## 📐 Arquitectura del Pattern

```
┌─────────────────────────────────────────────────────────┐
│ InventoryStrategy (Abstract Class)                      │
│ ────────────────────────────────────────────────────── │
│ + deduct(quantity): Promise<void>                       │
│ + hasStock(quantity): Promise<boolean>                  │
│ + calculateCost(quantity): Promise<Money>               │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ extends
          ┌───────────────┴───────────────┐
          │                               │
┌─────────────────────────┐  ┌────────────────────────────┐
│ RecipeBasedInventory    │  │ DirectInventory            │
│ ─────────────────────── │  │ ────────────────────────── │
│ - recipe: Recipe        │  │ - productId: ProductId     │
│ - deductIngredient      │  │ - deductIngredient         │
│ - getFifoCost           │  │ - getFifoCost              │
│ - checkStock            │  │ - checkStock               │
│                         │  │                            │
│ Productos PREPARADOS    │  │ Productos RETAIL           │
│ (Hamburguesa, Sandwich) │  │ (Gaseosa, Cerveza)         │
└─────────────────────────┘  └────────────────────────────┘
```

---

## 🔍 Estrategia 1: RecipeBasedInventory (Productos CON receta)

### **¿Cuándo se usa?**
- Productos **preparados** que requieren ingredientes
- Ejemplos: Hamburguesas, Sandwiches, Jugos preparados

### **¿Cómo funciona?**

```typescript
// src/contexts/menu/product/domain/inventory-strategies/recipe-based-inventory.ts

export class RecipeBasedInventory extends InventoryStrategy {
  constructor(
    private readonly recipe: Recipe,  // ← Receta con ingredientes
    private readonly deductIngredient: DeductIngredient,  // ← Use case para descontar
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly checkIngredientStock: CheckIngredientStock
  ) {
    super()
  }

  // Descontar ingredientes de la receta
  async deduct(quantity: number): Promise<void> {
    // 1. Escalar receta por la cantidad vendida
    const scaledItems = this.recipe.scaleByQuantity(quantity)
    // Si vendemos 3 hamburguesas y la receta es para 1:
    // → scaledItems = [carne: 600g, pan: 3u, lechuga: 150g]

    // 2. Descontar cada ingrediente del inventario
    for (const item of scaledItems) {
      await this.deductIngredient.run(
        item.ingredientId.value,    // ← ID del ingrediente
        item.quantity.value,         // ← Cantidad a descontar
        item.quantity.unitId,        // ← Unidad (gramos, unidades, etc)
        'Venta de producto con receta',
        null,  // referenceId (podría ser ID de venta)
        null   // performedBy (usuario que vendió)
      )
    }
  }

  // Verificar si hay stock de TODOS los ingredientes
  async hasStock(quantity: number): Promise<boolean> {
    const scaledItems = this.recipe.scaleByQuantity(quantity)

    for (const item of scaledItems) {
      const hasStock = await this.checkIngredientStock.run(
        item.ingredientId.value,
        item.quantity.value,
        item.quantity.unitId
      )

      if (!hasStock) {
        return false  // ← Si falta 1 ingrediente, NO hay stock
      }
    }

    return true  // ← Todos los ingredientes disponibles
  }

  // Calcular costo sumando costo FIFO de cada ingrediente
  async calculateCost(quantity: number): Promise<Money> {
    const scaledItems = this.recipe.scaleByQuantity(quantity)
    let totalCost: Money | null = null

    for (const item of scaledItems) {
      const cost = await this.getIngredientFifoCost.run(
        item.ingredientId.value,
        item.quantity.value,
        item.quantity.unitId
      )

      totalCost = totalCost ? totalCost.add(cost) : cost
    }

    return totalCost!
  }
}
```

### **Ejemplo Concreto:**

```typescript
// Receta: Hamburguesa Clásica
const recipe = Recipe.create({
  id: "recipe-burger",
  name: "Hamburguesa Clásica",
  items: [
    { ingredientId: "carne-molida", quantity: 200, unitId: "gramos" },
    { ingredientId: "pan-hamburguesa", quantity: 1, unitId: "unidad" },
    { ingredientId: "lechuga", quantity: 50, unitId: "gramos" },
    { ingredientId: "tomate", quantity: 30, unitId: "gramos" }
  ],
  recipeYield: { value: 1, unitId: "unidad" }
})

// Producto usa esta receta
const burger = Product.create({
  name: "Hamburguesa Clásica",
  price: 15000,
  recipeId: "recipe-burger"  // ← Referencia a receta
})

// Cuando vendemos 3 hamburguesas:
const strategy = new RecipeBasedInventory(recipe, ...)
await strategy.deduct(3)

// ✅ Se descuentan del inventario:
// - 600g de carne molida (200g × 3)
// - 3 unidades de pan
// - 150g de lechuga (50g × 3)
// - 90g de tomate (30g × 3)
```

---

## 🔍 Estrategia 2: DirectInventory (Productos SIN receta)

### **¿Cuándo se usa?**
- Productos **retail/reventa** que se venden tal cual
- Ejemplos: Gaseosas, Cervezas, Snacks empaquetados

### **¿Cómo funciona?**

```typescript
// src/contexts/menu/product/domain/inventory-strategies/direct-inventory.ts

export class DirectInventory extends InventoryStrategy {
  constructor(
    private readonly productId: ProductId,  // ← ID del producto
    private readonly deductIngredient: DeductIngredient,
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly checkIngredientStock: CheckIngredientStock,
    private readonly unitId: string = 'unit'  // ← Unidad por defecto
  ) {
    super()
  }

  // Descontar producto directamente
  async deduct(quantity: number): Promise<void> {
    // ⚠️ IMPORTANTE: Usa el MISMO sistema de batches que ingredientes
    // El producto retail es tratado como un "ingrediente" que no se transforma
    await this.deductIngredient.run(
      this.productId.value,  // ← ProductId usado como IngredientId
      quantity,
      this.unitId,
      'Venta de producto retail',
      null,
      null
    )
  }

  // Verificar stock del producto
  async hasStock(quantity: number): Promise<boolean> {
    return this.checkIngredientStock.run(
      this.productId.value,
      quantity,
      this.unitId
    )
  }

  // Calcular costo FIFO del producto
  async calculateCost(quantity: number): Promise<Money> {
    return this.getIngredientFifoCost.run(
      this.productId.value,
      quantity,
      this.unitId
    )
  }
}
```

### **Ejemplo Concreto:**

```typescript
// Producto sin receta
const cocaCola = Product.create({
  id: "product-coca-cola",
  name: "Coca Cola 500ml",
  price: 5000,
  recipeId: null  // ← SIN receta
})

// Strategy para producto retail
const strategy = new DirectInventory(
  cocaCola.id,
  deductUseCase,
  fifoCostUseCase,
  checkStockUseCase,
  'unidad'  // ← Se venden por unidades
)

// Cuando vendemos 5 Coca Colas:
await strategy.deduct(5)

// ✅ Se descuentan del inventario:
// - 5 unidades de "product-coca-cola" (tratado como ingrediente)
```

---

## 🔄 ¿Cómo se Selecciona la Estrategia?

El **Product** determina automáticamente qué estrategia usar basándose en si tiene `recipeId`:

```typescript
// En product.ts línea 259
toPrimitives(): ProductPrimitives {
  return {
    // ...
    inventoryStrategyType: this.recipeId ? 'RECIPE' : 'DIRECT',
    // ↑ Automático basado en recipeId
  }
}
```

### **Factory Pattern (típico para crear estrategias):**

```typescript
// Ejemplo de uso en un Use Case
export class SellProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly recipeRepository: RecipeRepository,
    private readonly strategyFactory: InventoryStrategyFactory
  ) {}

  async run(productId: string, quantity: number): Promise<void> {
    // 1. Buscar producto
    const product = await this.productRepository.search(new ProductId(productId))

    // 2. Crear estrategia según tipo de producto
    const strategy = await this.strategyFactory.create(product)

    // 3. Verificar stock
    const hasStock = await strategy.hasStock(quantity)
    if (!hasStock) {
      throw new InsufficientStock()
    }

    // 4. Descontar inventario (la estrategia decide CÓMO)
    await strategy.deduct(quantity)

    // 5. Calcular costo FIFO
    const cost = await strategy.calculateCost(quantity)

    // 6. Calcular margen de ganancia
    const revenue = product.price.multiply(quantity)
    const profit = revenue.subtract(cost)
  }
}

// Factory para crear estrategias
export class InventoryStrategyFactory {
  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly deductIngredient: DeductIngredient,
    private readonly getFifoCost: GetIngredientFifoCost,
    private readonly checkStock: CheckIngredientStock
  ) {}

  async create(product: Product): Promise<InventoryStrategy> {
    const primitives = product.toPrimitives()

    // Decisión: ¿RECIPE o DIRECT?
    if (primitives.recipeId) {
      // Producto CON receta → RecipeBasedInventory
      const recipe = await this.recipeRepository.search(
        new RecipeId(primitives.recipeId)
      )

      if (!recipe) {
        throw new RecipeNotFound(primitives.recipeId)
      }

      return new RecipeBasedInventory(
        recipe,
        this.deductIngredient,
        this.getFifoCost,
        this.checkStock
      )
    } else {
      // Producto SIN receta → DirectInventory
      return new DirectInventory(
        product.id,
        this.deductIngredient,
        this.getFifoCost,
        this.checkStock,
        'unidad'  // ← Configuración: unidad por defecto
      )
    }
  }
}
```

---

## 📊 Comparación de Estrategias

| Aspecto | RecipeBasedInventory | DirectInventory |
|---------|---------------------|-----------------|
| **Tipo de Producto** | Preparado (Hamburguesa) | Retail (Gaseosa) |
| **Depende de** | Recipe + Ingredientes | Solo ProductId |
| **Descuenta de** | Múltiples ingredientes | 1 producto (como ingrediente) |
| **Stock check** | Verifica TODOS los ingredientes | Verifica 1 producto |
| **Costo FIFO** | Suma costo de ingredientes | Costo del producto |
| **Complejidad** | Alta (múltiples items) | Baja (1 item) |
| **Ejemplo** | 3 hamburguesas → 600g carne, 3 panes, 150g lechuga | 3 Coca Colas → 3 unidades |

---

## 🎯 Ventajas del Strategy Pattern

### **1. Polimorfismo (Open/Closed Principle)**

```typescript
// Código cliente NO conoce la estrategia específica
async function processOrder(product: Product, quantity: number) {
  const strategy = await strategyFactory.create(product)

  // ✅ Mismo código para AMBOS tipos de productos
  const hasStock = await strategy.hasStock(quantity)
  await strategy.deduct(quantity)
  const cost = await strategy.calculateCost(quantity)

  // NO hay if/else aquí!
}
```

### **2. Extensibilidad**

Si en el futuro necesitas un nuevo tipo:

```typescript
// Ejemplo: Productos Semi-Preparados (ingrediente base + add-ons)
export class HybridInventory extends InventoryStrategy {
  constructor(
    private readonly baseIngredientId: string,
    private readonly addOns: RecipeItem[],
    private readonly deductIngredient: DeductIngredient
  ) {
    super()
  }

  async deduct(quantity: number): Promise<void> {
    // Descuenta ingrediente base
    await this.deductIngredient.run(this.baseIngredientId, quantity, 'unidad')

    // Descuenta add-ons
    for (const addOn of this.addOns) {
      await this.deductIngredient.run(
        addOn.ingredientId.value,
        addOn.quantity.value * quantity,
        addOn.quantity.unitId
      )
    }
  }
}

// ✅ Agregar al factory SIN cambiar código existente
```

### **3. Testabilidad**

```typescript
describe('RecipeBasedInventory', () => {
  it('should deduct all ingredients when selling product', async () => {
    const mockRecipe = RecipeMother.create({
      items: [
        RecipeItemMother.create({ ingredientId: 'carne', quantity: 200 }),
        RecipeItemMother.create({ ingredientId: 'pan', quantity: 1 })
      ]
    })

    const mockDeduct = jest.fn()
    const strategy = new RecipeBasedInventory(mockRecipe, mockDeduct, ...)

    await strategy.deduct(2)  // Vender 2 productos

    expect(mockDeduct).toHaveBeenCalledTimes(2)
    expect(mockDeduct).toHaveBeenCalledWith('carne', 400, 'gramos', ...)
    expect(mockDeduct).toHaveBeenCalledWith('pan', 2, 'unidad', ...)
  })
})
```

---

## 🔑 Punto Clave: Productos Retail = Ingredientes

**Observa esto en `DirectInventory` línea 34-35:**

```typescript
await this.deductIngredient.run(
  this.productId.value,  // ← ProductId usado como IngredientId
  quantity,
  this.unitId,
  'Venta de producto retail',
  null,
  null
)
```

### **¿Por qué productos retail usan el sistema de ingredientes?**

**Ventajas:**

1. ✅ **FIFO unificado:** Mismo sistema de batches para todo el inventario
2. ✅ **Costos consistentes:** Cálculo de costo FIFO único
3. ✅ **Simplificación:** No necesitas 2 sistemas de inventario separados
4. ✅ **Rastreabilidad:** Mismos reportes para ingredientes y productos retail

**Modelo mental:**

```
Sistema de Inventario (unificado)
├── Ingredientes transformables (carne, lechuga, pan)
│   └── Usados en recetas → Productos preparados
│
└── Ingredientes NO transformables (Coca Cola, Cerveza)
    └── Vendidos directamente → Productos retail
```

**En la base de datos:**

```sql
-- Tabla unificada de batches
CREATE TABLE ingredient_batches (
  id UUID PRIMARY KEY,
  ingredient_id UUID NOT NULL,  -- ← Puede ser ingrediente O productId
  quantity DECIMAL(10,2),
  unit_id UUID,
  unit_cost DECIMAL(10,2),
  purchased_at TIMESTAMP,
  batch_number VARCHAR(50)
);

-- Ejemplo de registros:
-- Ingrediente tradicional
INSERT INTO ingredient_batches VALUES (
  'batch-1', 'ingredient-carne', 5000, 'gramos', 0.02, NOW(), 'BATCH-001'
);

-- Producto retail (tratado como ingrediente)
INSERT INTO ingredient_batches VALUES (
  'batch-2', 'product-coca-cola', 24, 'unidad', 3.5, NOW(), 'BATCH-002'
);
```

---

## ✅ Resumen Ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| **¿Qué es el Strategy Pattern aquí?** | Encapsula 2 formas de descontar inventario (RECIPE vs DIRECT) |
| **¿Cuándo se usa RecipeBasedInventory?** | Productos CON `recipeId` (hamburguesas, sandwiches) |
| **¿Cuándo se usa DirectInventory?** | Productos SIN `recipeId` (gaseosas, cervezas) |
| **¿Cómo se decide?** | `product.recipeId !== null` → RECIPE, else → DIRECT |
| **¿Dónde se crea la estrategia?** | En un `InventoryStrategyFactory` basado en el producto |
| **¿Productos retail usan ingredientes?** | SÍ, reusan el sistema de batches/FIFO unificado |
| **¿Se puede extender?** | SÍ, agregando nuevas estrategias sin cambiar código existente |

---

**Fecha de creación:** 2025-12-12
**Versión:** 1.0.0
**Contextos relacionados:** Menu (Product), Kitchen (Recipe), Inventory (Stock)
