# 🔍 Análisis: Relación Recipe ↔ Product

**Fecha:** 2025-11-04
**Contexto:** Análisis de la relación entre Recipe y Product en el módulo de productos
**Pregunta:** ¿Debería Recipe guardar el `productId` en lugar de que Product guarde `recipeId`?

---

## 📊 Situación Actual

### Implementación Actual (Product → Recipe)

```typescript
// Product guarda referencia a Recipe
export class Product extends AggregateRoot {
  private recipeId: RecipeId | null  // ← Product tiene la FK
  // ...
}

// Recipe NO tiene referencia a Product
export class Recipe extends AggregateRoot {
  // NO tiene productId
  // ...
}
```

**Base de datos:**
```sql
-- products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  recipe_id UUID NULLABLE,  -- ← FK aquí
  -- ...
);

-- recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  -- NO tiene product_id
  -- ...
);
```

---

## 🎯 Propuesta Alternativa (Recipe → Product)

```typescript
// Product NO tiene receta
export class Product extends AggregateRoot {
  // NO tiene recipeId
  // ...
}

// Recipe guarda referencia a Product
export class Recipe extends AggregateRoot {
  private productId: ProductId  // ← Recipe tiene la FK
  // ...
}
```

**Base de datos:**
```sql
-- products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  -- NO tiene recipe_id
  -- ...
);

-- recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,  -- ← FK aquí
  -- ...
);
```

---

## 💡 Análisis Desde DDD y Domain-Driven Design

### 1. **Aggregate Boundaries (Límites de Agregados)**

#### ✅ Implementación Actual (Product → Recipe): CORRECTA

**Razón:** Product es el **Aggregate Root** principal del bounded context de productos.

- **Product controla su ciclo de vida completo:**
  - Tiene identidad propia (SKU, precio, imagen, categoría)
  - Se vende independientemente de cómo se produce
  - Puede existir sin receta (productos comprados para reventa)
  - Es la entidad que se modela en el menú, POS, catálogo

- **Recipe es un detalle de implementación:**
  - Es información técnica de cocina (cómo producir el producto)
  - NO tiene identidad de negocio fuera del producto
  - Su propósito es calcular costos e inventario

**Conclusión DDD:** Product debe ser el Aggregate Root que contiene o referencia Recipe.

#### ❌ Propuesta (Recipe → Product): INCORRECTA

**Por qué:**
- Invierte la jerarquía natural del dominio
- Recipe se convertiría en el agregado principal (no tiene sentido)
- Product perdería control sobre su información de producción

---

### 2. **Ubiquitous Language (Lenguaje Ubicuo)**

Analicemos cómo hablan los usuarios del negocio:

#### ✅ Lenguaje Natural del Negocio:

- "El **Sándwich Clásico** tiene una receta de 5 ingredientes"
- "Este **producto** requiere pan, jamón, queso..."
- "¿Cuál es la receta del **Sándwich Italiano**?"
- "Necesito ver la información del **producto**, incluyendo su receta"

#### ❌ Lenguaje NO Natural:

- "Esta receta produce el producto X" (menos común)
- "La receta #123 es para cuál producto?" (confuso)

**Conclusión Lenguaje:** La dirección natural es Product → Recipe.

---

### 3. **Cardinalidad y Multiplicidad**

Analicemos las posibles relaciones:

#### Escenario 1: One-to-One (1:1) - Producto ↔ Receta

**Si es 1:1, ¿quién debe tener la FK?**

✅ **Product → Recipe (Actual):**
- ✅ Product puede existir sin Recipe (ej: bebidas compradas)
- ✅ Recipe es opcional (`recipeId: string | null`)
- ✅ Permite productos sin receta (DIRECT inventory strategy)

❌ **Recipe → Product (Propuesta):**
- ❌ Recipe SIEMPRE necesitaría un Product (acoplamiento fuerte)
- ❌ No permite productos sin receta
- ❌ Fuerza a crear Recipe incluso para productos simples

**Ganador:** Product → Recipe

---

#### Escenario 2: One-to-Many (1:N) - ¿Una receta para múltiples productos?

**Pregunta de Negocio:** ¿Puede una misma receta usarse para múltiples productos?

**Ejemplo Real:**
- "Salsa de Tomate Base" podría usarse en:
  - Sándwich Italiano
  - Sándwich Especial
  - Hamburguesa Clásica

**Si la respuesta es SÍ (1:N):**

✅ **Recipe → Products (Múltiples productos usan la misma receta):**
```typescript
export class Recipe {
  // NO tiene productId único
  // Es reutilizable entre productos
}

export class Product {
  private recipeId: RecipeId | null  // ← Muchos productos → 1 receta
}
```

❌ **Product → Recipe con FK en Recipe:**
```typescript
export class Recipe {
  private productId: ProductId  // ← PROBLEMA: ¿Cuál producto si hay 3?
}
```

**Conclusión:** Si Recipe es reutilizable (1:N), entonces Product → Recipe es la ÚNICA opción válida.

---

**Si la respuesta es NO (1:1 estricto):**

Entonces ambas opciones son técnicamente viables, pero...

✅ **Product → Recipe sigue siendo mejor porque:**
- Recipe es un componente/detalle del Product
- Product es la entidad principal del bounded context
- Mantiene la agregación natural (Product contiene Recipe)

---

### 4. **Dependency Direction (Dirección de Dependencias)**

#### Principio de DDD: "Depende hacia el núcleo del dominio"

**Núcleo del dominio en un POS:**
- 🏆 **Product** (lo que se vende)
- CategoryProduct (organización)
- Order (transacciones)
- Inventory (stock)
- Recipe (soporte técnico)

**Jerarquía de Importancia:**
```
Product (CORE) → Recipe (SUPPORT)
```

✅ **Product → Recipe:**
- Product (core) referencia Recipe (support)
- ✅ Dirección correcta de dependencia

❌ **Recipe → Product:**
- Recipe (support) referencia Product (core)
- ❌ Dependencia invertida (anti-patrón)

---

### 5. **Queries y Casos de Uso del Negocio**

#### Queries Comunes:

✅ **Implementación Actual (Product → Recipe):**

```typescript
// ✅ COMÚN: "Dame el producto y su receta"
const product = await productRepo.findById(productId)
const recipe = product.recipeId
  ? await recipeRepo.findById(product.recipeId)
  : null

// ✅ COMÚN: "Lista todos los productos con recetas"
const products = await productRepo.searchAll()
// Cada producto tiene recipeId directamente

// ✅ EFICIENTE: Un solo JOIN en SQL
SELECT p.*, r.*
FROM products p
LEFT JOIN recipes r ON p.recipe_id = r.id
```

❌ **Propuesta (Recipe → Product):**

```typescript
// ❌ INCÓMODO: "Dame el producto y su receta"
const product = await productRepo.findById(productId)
const recipe = await recipeRepo.findByProductId(product.id)  // Query extra

// ❌ INEFICIENTE: "Lista productos con recetas"
const products = await productRepo.searchAll()
// Necesitas N+1 queries para obtener las recetas
for (const product of products) {
  const recipe = await recipeRepo.findByProductId(product.id)
}

// ❌ ANTI-PATRÓN: JOIN inverso
SELECT p.*, r.*
FROM products p
LEFT JOIN recipes r ON r.product_id = p.id  -- JOIN inverso
```

**Conclusión:** Product → Recipe es más natural para queries.

---

### 6. **Lifecycle Management (Gestión del Ciclo de Vida)**

#### ✅ Implementación Actual:

```typescript
// Crear producto sin receta (bebidas, snacks comprados)
const cocaCola = Product.create({
  name: "Coca Cola 500ml",
  recipeId: null  // ← Sin receta (producto comprado)
})

// Crear producto con receta (preparado en cocina)
const sandwich = Product.create({
  name: "Sándwich Clásico",
  recipeId: recipe.id  // ← Con receta
})

// Eliminar receta (producto pasa a DIRECT inventory)
product.update({ recipeId: null })  // ← Flexible
```

#### ❌ Propuesta:

```typescript
// ❌ PROBLEMA: ¿Cómo crear productos sin receta?
const cocaCola = Product.create({
  name: "Coca Cola 500ml"
  // ¿Cómo indica que NO tiene receta?
})

// Recipe SIEMPRE necesita productId
const recipe = Recipe.create({
  productId: product.id,  // ← Acoplamiento fuerte
  // ...
})

// ❌ PROBLEMA: Si eliminas la receta, ¿qué pasa con el producto?
```

**Conclusión:** Product → Recipe permite mayor flexibilidad.

---

### 7. **Event Sourcing y Domain Events**

#### ✅ Eventos Naturales (Product → Recipe):

```typescript
ProductCreated { productId, recipeId: null }
RecipeAssignedToProduct { productId, recipeId }
RecipeUpdated { recipeId, newIngredients }
RecipeRemovedFromProduct { productId, oldRecipeId }
ProductDeleted { productId }  // Recipe puede sobrevivir si es reutilizable
```

#### ❌ Eventos con Propuesta (Recipe → Product):

```typescript
ProductCreated { productId }
RecipeCreated { recipeId, productId }  // ← Acoplamiento fuerte
// ¿Qué pasa si Product se elimina? ¿Recipe también?
// ¿Qué pasa si quieres reutilizar Recipe?
```

---

### 8. **Consistency Boundaries (Límites de Consistencia)**

**Pregunta clave:** ¿Cuándo cambia Product, debe cambiar Recipe automáticamente?

**Respuesta:** NO. Son consistencias separadas.

- **Cambiar precio de Product:** NO afecta Recipe
- **Cambiar nombre de Product:** NO afecta Recipe
- **Cambiar ingredientes de Recipe:** NO afecta Product (solo costos)

**Conclusión DDD:** Product y Recipe deben ser agregados separados.

✅ **Product → Recipe (Actual):**
- Agregados independientes
- Product referencia Recipe por ID (weak reference)
- Transacciones separadas

❌ **Recipe → Product (Propuesta):**
- Si Recipe tiene FK a Product, parece que Recipe es "hijo" de Product
- Pero si Recipe tiene la FK, ¿quién es el padre? (confuso)

---

## 🏗️ Análisis de Arquitectura de Datos

### Normalización de Base de Datos

**Regla:** La Foreign Key debe estar en el lado "many" de una relación 1:N, o en el lado opcional de una relación 1:1.

#### Si Recipe es 1:1 con Product:

✅ **FK en Product (recipeId nullable):**
- ✅ Permite productos sin receta
- ✅ Product es la entidad principal
- ✅ Recipe es opcional

❌ **FK en Recipe (productId NOT NULL):**
- ❌ Recipe siempre necesita un Product
- ❌ Product pierde control sobre su receta
- ❌ Menos flexible

---

#### Si Recipe es 1:N (reutilizable):

✅ **SOLO puede ser Product → Recipe:**
```
Recipe (1) ← (N) Product
```
FK DEBE estar en Product.

---

## 🎭 Casos de Uso del Mundo Real

### Caso 1: Producto sin Receta (Bebidas, Snacks)

✅ **Product → Recipe:**
```typescript
Product.create({
  name: "Coca Cola",
  recipeId: null,  // ← Sin receta
  inventoryStrategy: 'DIRECT'
})
```

❌ **Recipe → Product:**
```
// ¿Cómo manejar productos sin receta?
// ¿Crear Recipe vacía? (anti-patrón)
```

---

### Caso 2: Cambiar Receta de un Producto

✅ **Product → Recipe:**
```typescript
product.update({
  recipeId: newRecipeId  // ← Simple
})
```

❌ **Recipe → Product:**
```typescript
oldRecipe.update({ productId: null })  // ¿Eliminar Recipe?
newRecipe.update({ productId: product.id })  // ¿Crear nueva?
```

---

### Caso 3: Eliminar un Producto

✅ **Product → Recipe:**
```typescript
await productRepo.delete(productId)
// Recipe puede sobrevivir (si es reutilizable)
// O eliminarse en cascada (si es 1:1 estricto)
```

❌ **Recipe → Product:**
```typescript
await productRepo.delete(productId)
// ¿Qué hacer con Recipe que tiene productId?
// ¿Eliminarla también? (acoplamiento)
// ¿Dejarla huérfana? (inconsistencia)
```

---

### Caso 4: Reutilizar Recetas (Scenario Avanzado)

**Ejemplo:** "Salsa Base" usada en 3 sándwiches diferentes.

✅ **Product → Recipe (soporta 1:N):**
```typescript
const baseRecipe = Recipe.create({ name: "Salsa Base" })

const sandwich1 = Product.create({ recipeId: baseRecipe.id })
const sandwich2 = Product.create({ recipeId: baseRecipe.id })
const sandwich3 = Product.create({ recipeId: baseRecipe.id })
```

❌ **Recipe → Product (NO soporta 1:N):**
```typescript
const recipe = Recipe.create({ productId: sandwich1.id })
// ¿Cómo referenciar sandwich2 y sandwich3?
// NO ES POSIBLE con FK única
```

---

## 📈 Performance y Escalabilidad

### Queries más Comunes en un POS:

1. **Listar productos del menú (con/sin receta):**
   ```sql
   -- ✅ Eficiente con Product → Recipe
   SELECT p.*, r.name as recipe_name
   FROM products p
   LEFT JOIN recipes r ON p.recipe_id = r.id
   WHERE p.is_active = true
   ```

2. **Calcular costo de un producto:**
   ```sql
   -- ✅ Natural con Product → Recipe
   SELECT p.price, r.items
   FROM products p
   JOIN recipes r ON p.recipe_id = r.id
   WHERE p.id = ?
   ```

3. **Buscar productos por categoría:**
   ```sql
   -- ✅ Simple, sin necesidad de JOIN a recipes
   SELECT * FROM products WHERE category_id = ?
   ```

**Conclusión:** Product → Recipe es más performante para queries comunes.

---

## 🔐 Integridad Referencial

### Con Product → Recipe (Actual):

```sql
ALTER TABLE products
ADD CONSTRAINT fk_products_recipe
FOREIGN KEY (recipe_id) REFERENCES recipes(id)
ON DELETE SET NULL;  -- Si se elimina recipe, product.recipe_id = NULL
```

✅ **Ventajas:**
- Producto puede existir sin receta
- Eliminar receta no rompe el producto
- Flexible para cambios

---

### Con Recipe → Product (Propuesta):

```sql
ALTER TABLE recipes
ADD CONSTRAINT fk_recipes_product
FOREIGN KEY (product_id) REFERENCES products(id)
ON DELETE CASCADE;  -- Si se elimina product, recipe también
```

❌ **Problemas:**
- Receta no puede existir sin producto
- Eliminar producto elimina receta (pérdida de información)
- Menos flexible

---

## 🧩 Patrón de Diseño: Composition vs Aggregation

### Composition (Composición Fuerte)
- El componente NO existe sin el contenedor
- Ejemplo: `Product` tiene `ProductImage` (si eliminas Product, eliminas la imagen)

### Aggregation (Agregación Débil)
- El componente PUEDE existir independientemente
- Ejemplo: `Product` referencia `Category` (eliminar Product NO elimina Category)

**¿Qué es Recipe respecto a Product?**

#### Opción A: Recipe es Composition (parte integral de Product)
- ✅ Product → Recipe (Product contiene/referencia Recipe)
- Recipe es un detalle interno de Product

#### Opción B: Recipe es Aggregation (entidad independiente)
- ✅ Product → Recipe (Product referencia Recipe)
- Recipe puede reutilizarse entre productos

**En ambos casos, la dirección es Product → Recipe.**

---

## 🎓 Referencias de Patrones DDD

### Eric Evans (Blue Book):

> "The Aggregate Root is the only member of the Aggregate that outside objects can hold references to."

- **Product** es el Aggregate Root
- **Recipe** es parte del agregado o una referencia débil
- Conclusión: Product debe referenciar Recipe

---

### Vaughn Vernon (Red Book):

> "Prefer references to IDs over direct object references between Aggregates."

✅ **Product → Recipe (por ID):**
```typescript
private recipeId: RecipeId | null  // ← Referencia por ID
```

❌ **Recipe → Product directo:**
```typescript
private product: Product  // ← Referencia directa (anti-patrón)
```

---

## 🏆 Conclusión Final con Argumentos Sólidos

### ✅ **Mantener Product → Recipe (Implementación Actual)**

#### Argumentos a Favor (10 Razones):

1. **DDD Aggregate Boundaries:** Product es el Aggregate Root natural
2. **Ubiquitous Language:** "El producto tiene una receta", no "la receta es de un producto"
3. **Flexibilidad:** Permite productos sin receta (bebidas, snacks)
4. **Cardinalidad:** Soporta tanto 1:1 como 1:N (Recipe reutilizable)
5. **Dependency Direction:** Core (Product) → Support (Recipe)
6. **Query Performance:** Queries naturales y eficientes
7. **Lifecycle Management:** Product controla su ciclo de vida
8. **Consistency Boundaries:** Agregados independientes
9. **Database Normalization:** FK en el lado opcional
10. **Industry Best Practices:** Patrón estándar en sistemas POS

---

### ❌ **NO usar Recipe → Product (Propuesta Rechazada)**

#### Argumentos en Contra (8 Razones):

1. **Invierte la jerarquía natural del dominio**
2. **No permite productos sin receta**
3. **Acoplamiento fuerte innecesario**
4. **Queries más complejas e ineficientes**
5. **Lenguaje NO natural del negocio**
6. **Menor flexibilidad para cambios**
7. **Problemas con integridad referencial**
8. **NO soporta recetas reutilizables (1:N)**

---

## 🚀 Recomendación

**MANTENER la implementación actual: Product → Recipe**

**Mejoras sugeridas (sin cambiar la dirección):**

```typescript
// ✅ Mantener
export class Product {
  private recipeId: RecipeId | null  // ← FK aquí

  // Mejora: Agregar método helper
  hasRecipe(): boolean {
    return this.recipeId !== null
  }

  getRecipeId(): string | null {
    return this.recipeId?.value ?? null
  }
}

// ✅ Recipe sigue sin productId
export class Recipe {
  // NO tiene productId

  // Mejora: Si quieres buscar productos por receta,
  // usa un método en ProductRepository
}
```

**Repository Pattern:**
```typescript
export abstract class ProductRepository {
  abstract findByRecipeId(recipeId: RecipeId): Promise<Product[]>
  // ← Query en la dirección contraria cuando sea necesario
}
```

---

## 📝 Nota Final

La dirección **Product → Recipe** es la decisión arquitectónicamente correcta basada en:
- Principios de DDD
- Patrones de diseño
- Normalización de datos
- Lenguaje del negocio
- Mejores prácticas de la industria

**No cambiar** esta relación a menos que el negocio requiera explícitamente que las recetas sean la entidad principal y los productos sean secundarios (altamente improbable en un POS).
