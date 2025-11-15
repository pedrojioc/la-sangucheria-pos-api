# 🗣️ Análisis de Lenguaje Ubicuo: "Catalog" vs "Menu"

**Fecha:** 2025-11-04
**Contexto:** Decidir el nombre correcto para el Bounded Context de productos
**Pregunta:** ¿Catalog o Menu?

---

## 🎯 Principio Fundamental de DDD

> **"El código debe hablar el lenguaje del negocio, no el lenguaje de los programadores."**
> — Eric Evans, Domain-Driven Design

---

## 🔍 Análisis del Lenguaje Real

### En un Restaurante, ¿qué dice la gente?

#### ✅ Lenguaje Natural (MENU):

**Clientes dicen:**
- "¿Puedo ver el **menú**?"
- "¿Qué hay en el **menú** hoy?"
- "Este **ítem del menú** se ve delicioso"
- "¿Cuánto cuesta esto en el **menú**?"

**Meseros dicen:**
- "El **menú** tiene 15 sándwiches"
- "Voy a mostrarle el **menú**"
- "Este **producto del menú** está agotado"
- "Actualizamos el **menú** cada semana"

**Gerentes dicen:**
- "Agregar nuevo ítem al **menú**"
- "Cambiar precios del **menú**"
- "Organizar el **menú** por categorías"
- "El **menú digital** en el tablet"

---

#### ❌ Lenguaje Técnico (CATALOG):

**Programadores dicen:**
- "El **catálogo** de productos"
- "Sistema de **catalogación**"
- "**Catalog** service"
- "Product **catalog** API"

**Clientes/Meseros NO dicen:**
- ❌ "¿Puedo ver el catálogo?" (suena a tienda de ropa)
- ❌ "¿Qué hay en el catálogo?" (suena a manual)
- ❌ "El ítem del catálogo" (muy técnico)

---

## 📊 Comparación Directa

| Criterio | CATALOG | MENU |
|----------|---------|------|
| **Usado por el negocio** | ❌ No | ✅ Sí |
| **Natural en conversaciones** | ❌ No | ✅ Sí |
| **Específico del dominio** | ❌ Genérico | ✅ Específico (restaurantes) |
| **Entendible por stakeholders** | ⚠️ Técnico | ✅ Inmediato |
| **Aparece en documentos** | ❌ Raro | ✅ Común |
| **Usado en el POS UI** | ❌ No | ✅ Sí |

---

## 🏢 Casos de Uso Reales

### Caso 1: Reunión con el Dueño del Restaurante

**Con "Catalog":**
```
Dev: "Vamos a crear el módulo de Catalog para gestionar los productos"
Owner: "¿Catalog? ¿Qué es eso?"
Dev: "Es el catálogo de productos..."
Owner: "Ah, ¿te refieres al MENÚ?"
```

**Con "Menu":**
```
Dev: "Vamos a crear el módulo de Menu para gestionar los productos"
Owner: "Perfecto, el menú. Sí, necesitamos actualizar precios seguido"
Dev: "Exacto, el Menu Context manejará eso"
```

✅ **Comunicación clara desde el inicio.**

---

### Caso 2: Training de Nuevo Desarrollador

**Con "Catalog":**
```
Senior: "Este es el Catalog Context"
Junior: "¿Qué hace?"
Senior: "Gestiona los productos que se muestran en el POS"
Junior: "Ah, el menú"
Senior: "Sí, pero le llamamos catalog"
Junior: "¿Por qué?"
Senior: "🤷 Es término técnico..."
```

**Con "Menu":**
```
Senior: "Este es el Menu Context"
Junior: "Entiendo, el menú del restaurante"
Senior: "Correcto, gestiona los ítems que se venden"
Junior: "Tiene sentido"
```

✅ **Onboarding más rápido.**

---

### Caso 3: Documentación de APIs

**Con "Catalog":**
```
GET /api/catalog/products
POST /api/catalog/products
GET /api/catalog/categories
```

⚠️ Mesero viendo la documentación: "¿Esto es el menú?"

**Con "Menu":**
```
GET /api/menu/items
POST /api/menu/items
GET /api/menu/categories
```

✅ Mesero viendo la documentación: "Ah, API del menú, claro"

---

## 🌍 Contextos Internacionales

### En Español (tu mercado):
- ✅ **"Menú"** es universal
- ❌ "Catálogo" suena a tienda retail o manual

### En Inglés:
- ✅ **"Menu"** es estándar en restaurantes
- ⚠️ "Catalog" se usa más en e-commerce (Amazon, retail)

---

## 🔬 Análisis Semántico

### "Catalog" implica:
- 📚 Listado completo de productos
- 🏪 Retail, e-commerce, tiendas online
- 📖 Documento estático de referencia
- 💼 Contexto corporativo/técnico

**Asociaciones mentales:**
- Catálogo de Ikea
- Catálogo de productos de Amazon
- Catálogo de una biblioteca

---

### "Menu" implica:
- 🍽️ Oferta de comida en restaurante
- 📱 Interfaz de selección en POS
- 🎨 Presentación visual al cliente
- 👨‍🍳 Contexto gastronómico

**Asociaciones mentales:**
- Menú del día
- Menú de desayuno/almuerzo/cena
- Carta del restaurante
- Tablet con menú digital

---

## 🎭 Prueba del "Ubiquitous Language"

### Test 1: ¿Lo usarías en una conversación real?

**Scenario:** Llamada telefónica con el dueño

❌ "Necesito actualizar el catálogo"
✅ "Necesito actualizar el menú"

**Ganador:** Menu

---

### Test 2: ¿Aparece en la UI del usuario final?

**Pantalla del POS:**

❌ Botón: "Ver Catálogo"
✅ Botón: "Ver Menú"

**Ganador:** Menu

---

### Test 3: ¿Lo entiende alguien sin contexto técnico?

**Sin explicación:**

❌ "Catalog Context" → "¿Qué es eso?"
✅ "Menu Context" → "Ah, el menú del restaurante"

**Ganador:** Menu

---

### Test 4: ¿Es específico del dominio?

❌ "Catalog" → Genérico (cualquier industria)
✅ "Menu" → Específico (restaurantes, gastronomía)

**Ganador:** Menu

---

## 💼 Casos en Otras Industrias (Comparación)

### E-Commerce (Amazon, MercadoLibre):
- ✅ **"Catalog"** es correcto
- Productos en catálogo
- Búsqueda en catálogo
- "Product Catalog Service"

### Restaurantes (tu caso):
- ✅ **"Menu"** es correcto
- Ítems en el menú
- Categorías del menú
- "Menu Management Service"

### Bibliotecas:
- ✅ **"Catalog"** es correcto
- Catálogo de libros
- Sistema de catalogación

**Conclusión:** El nombre debe reflejar el dominio específico.

---

## 📚 Referencias de la Industria

### Sistemas POS Reconocidos:

**1. Toast POS (USA):**
- "Menu Management"
- "Menu Items"
- "Menu Categories"
✅ Usan **"Menu"**

**2. Square POS (USA):**
- "Menu Builder"
- "Menu Items"
- "Digital Menu"
✅ Usan **"Menu"**

**3. Revel POS (USA):**
- "Menu Configuration"
- "Menu Items & Modifiers"
✅ Usan **"Menu"**

**4. Lightspeed Restaurant (Canada):**
- "Menu Management"
- "Menu Structure"
✅ Usan **"Menu"**

**Conclusión:** La industria de POS para restaurantes usa **"Menu"**, no "Catalog".

---

## 🧠 Impacto en el Código

### Estructura con "Catalog":

```
src/contexts/catalog/
├── domain/
│   ├── product/
│   │   ├── product.ts
│   │   └── product-repository.ts
│   └── category/
│       └── product-category.ts
├── application/
│   ├── create-product.ts
│   └── update-product-price.ts
└── presentation/
    └── catalog.controller.ts
```

**Código:**
```typescript
export class CatalogController {
  @Get('/catalog/products')
  async getProducts() { }
}

export class CreateProduct { }
export class ProductRepository { }
```

---

### Estructura con "Menu":

```
src/contexts/menu/
├── domain/
│   ├── item/
│   │   ├── menu-item.ts              ← Más claro
│   │   └── menu-item-repository.ts
│   └── category/
│       └── menu-category.ts
├── application/
│   ├── create-menu-item.ts           ← Más natural
│   └── update-item-price.ts
└── presentation/
    └── menu.controller.ts
```

**Código:**
```typescript
export class MenuController {
  @Get('/menu/items')                  // ← Más natural
  async getMenuItems() { }
}

export class CreateMenuItem { }       // ← Más claro
export class MenuItemRepository { }
```

---

## 🎯 Nombres de Clases: Comparación

| Concepto | Con "Catalog" | Con "Menu" | Mejor |
|----------|---------------|------------|-------|
| Agregado | Product | MenuItem | ✅ MenuItem |
| Categoría | ProductCategory | MenuCategory | ✅ MenuCategory |
| Use Case | CreateProduct | CreateMenuItem | ✅ CreateMenuItem |
| Repositorio | ProductRepository | MenuItemRepository | ⚠️ Empate |
| Controller | CatalogController | MenuController | ✅ MenuController |
| Evento | ProductCreated | MenuItemCreated | ⚠️ Empate |

---

## ⚖️ Pros y Contras Finales

### "CATALOG" Context

**Pros:**
- ✅ Término técnico estándar en software
- ✅ Usado en e-commerce y retail
- ✅ Familiar para desarrolladores
- ✅ Genérico (si cambias de dominio, sigue aplicando)

**Contras:**
- ❌ NO es lenguaje del negocio (restaurantes)
- ❌ Requiere explicación a stakeholders
- ❌ No aparece en conversaciones reales
- ❌ Desconectado del dominio específico

---

### "MENU" Context

**Pros:**
- ✅ **Lenguaje ubicuo del restaurante** ⭐
- ✅ Entendible por todos (técnicos y no técnicos)
- ✅ Usado en la industria POS
- ✅ Aparece naturalmente en conversaciones
- ✅ Específico del dominio (gastronomía)
- ✅ Usado en UI y documentación

**Contras:**
- ⚠️ Menos "técnico" (pero eso es bueno en DDD)
- ⚠️ Si el negocio cambia a retail, el nombre no aplica (poco probable)

---

## 🏆 Recomendación Final

### **Usar "MENU" Context**

**Razones principales:**

1. **Es el lenguaje del negocio** ⭐⭐⭐
   - "Menú" es la palabra que usan clientes, meseros, gerentes

2. **Específico del dominio** ⭐⭐
   - Tu dominio es restaurantes, usa su vocabulario

3. **Estándar de la industria** ⭐⭐
   - Toast, Square, Revel, Lightspeed usan "Menu"

4. **Comunicación clara** ⭐
   - No requiere traducción mental técnico ↔ negocio

5. **DDD puro** ⭐⭐⭐
   - Eric Evans dice: "Habla el lenguaje del dominio"

---

## 📝 Cambios Sugeridos

### En lugar de:
```
src/contexts/catalog/
```

### Usar:
```
src/contexts/menu/
```

### Renombramiento de conceptos:

| Antes (Catalog) | Después (Menu) |
|----------------|----------------|
| Product | MenuItem |
| ProductCategory | MenuCategory |
| ProductRepository | MenuItemRepository |
| CreateProduct | CreateMenuItem |
| UpdateProductPrice | UpdateMenuItemPrice |
| ProductController | MenuController |

---

## 🚨 Excepciones a Considerar

### ¿Cuándo "Product" sigue siendo válido?

**Dentro del código interno del contexto:**

```typescript
// ✅ Esto está bien
export class MenuItem extends AggregateRoot {
  // Propiedades internas pueden usar términos técnicos
  private sku: ProductSku        // ← SKU es término técnico universal
  private price: ProductPrice    // ← Price es genérico
}
```

**En eventos hacia otros contextos:**

```typescript
// ✅ Puede ser "Product" si otros contextos lo ven así
export class MenuItemCreated extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly productId: string,  // ← Para Inventory puede ser "product"
  )
}
```

---

## 🎯 Decisión Final

### **Recomendación: Usar "MENU" Context**

**Estructura propuesta:**

```
src/contexts/
├── menu/                          ← CAMBIO: Era "catalog"
│   ├── domain/
│   │   ├── item/                  ← CAMBIO: Era "product"
│   │   │   ├── menu-item.ts
│   │   │   ├── menu-item-id.ts
│   │   │   └── menu-item-repository.ts
│   │   └── category/
│   │       └── menu-category.ts
│   ├── application/
│   │   ├── create-menu-item.ts
│   │   └── update-item-price.ts
│   └── presentation/
│       └── menu.controller.ts
│
├── inventory/                     ← Sin cambios
├── production/                    ← Sin cambios (o "kitchen"?)
└── shared-kernel/                 ← Sin cambios
```

---

## 💡 Bonus: ¿Otros contextos necesitan renombrado?

### Production Context → ¿"Kitchen" Context?

**Lenguaje del negocio:**
- ✅ "La **cocina** prepara los pedidos"
- ✅ "Receta de **cocina**"
- ✅ "**Kitchen** display system"

**Vs.**

- ⚠️ "Production context" (muy industrial)
- ⚠️ "Producción" (suena a fábrica)

**Recomendación:** Considera **"Kitchen"** en lugar de "Production"

---

## 📋 Resumen Ejecutivo

| Aspecto | Catalog | Menu | Ganador |
|---------|---------|------|---------|
| Lenguaje del negocio | ❌ | ✅ | **MENU** |
| Usado por stakeholders | ❌ | ✅ | **MENU** |
| Específico del dominio | ❌ | ✅ | **MENU** |
| Estándar de industria POS | ❌ | ✅ | **MENU** |
| Natural en código | ⚠️ | ✅ | **MENU** |
| Claridad en APIs | ⚠️ | ✅ | **MENU** |

**Resultado:** MENU gana 6-0

---

## ✅ Acción Recomendada

**Actualizar el plan de migración para usar "Menu" en lugar de "Catalog".**

```bash
# Estructura correcta
src/contexts/
├── menu/              ← Era "catalog"
├── inventory/
├── kitchen/           ← Era "production" (opcional)
└── shared-kernel/
```

**Beneficio:** Código que habla el lenguaje del negocio desde el día 1.
