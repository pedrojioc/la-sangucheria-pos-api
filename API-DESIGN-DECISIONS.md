# API Design Decisions

Este documento contiene las decisiones de diseño de API tomadas para el proyecto La Sanguchería POS.

---

## 📋 Decisión: Endpoint Único con Paginación por Defecto

**Fecha:** 2025-10-24
**Estado:** ✅ Aprobado
**Contexto:** Endpoints de listado de recursos

---

### 🎯 Problema

Al implementar el patrón Criteria para queries complejas, surgió la pregunta:

**¿Deberíamos tener dos endpoints separados?**

```bash
# Opción A: Dos endpoints
GET /ingredient-categories        # Sin paginación
GET /ingredient-categories/search # Con paginación + filtros

# Opción B: Un solo endpoint
GET /ingredient-categories        # Siempre paginado + filtros opcionales
```

---

### ✅ Decisión: Endpoint Único con Paginación por Defecto

**Implementar un solo endpoint que:**
- Siempre retorne resultados paginados
- Acepte filtros opcionales
- Tenga valores por defecto razonables (`page=1`, `pageSize=20`)
- Permita omitir parámetros para casos simples

---

### 📚 Justificación

#### 1. **Industry Standards (Grandes Empresas)**

Todas las empresas líderes usan paginación por defecto:

| Empresa | Endpoint | Paginación |
|---------|----------|------------|
| **GitHub** | `GET /repos/:owner/:repo/issues` | ✅ Siempre (default: 30, max: 100) |
| **Google APIs** | `GET /gmail/v1/users/me/messages` | ✅ Siempre (default: 100, max: 500) |
| **Stripe** | `GET /v1/customers` | ✅ Siempre (default: 10, max: 100) |
| **Twitter** | `GET /2/tweets/search/recent` | ✅ Siempre (default: 10, max: 100) |
| **Microsoft Graph** | `GET /v1.0/users` | ✅ Siempre (default: 10-100) |

**Ninguna empresa grande expone endpoints sin paginación en APIs públicas.**

#### 2. **Recomendaciones de Expertos**

**Martin Fowler:**
> "Never return unbounded result sets from a query. Always use pagination or impose a maximum limit."

**Roy Fielding (Creador de REST):**
> "A representation should be complete but finite. Pagination is essential for large datasets."

**Google API Design Guide:**
> "List methods MUST support pagination, even if results are typically small. This prevents performance issues as data grows."

**Uncle Bob (Clean Architecture):**
> "A system should fail gracefully under load. Returning unbounded data violates the principle of defensive programming."

#### 3. **Ventajas Técnicas**

✅ **Performance garantizada:** No hay riesgo de OOM (Out of Memory) con datasets grandes
✅ **Escalabilidad:** El endpoint crece bien sin cambios breaking
✅ **Simplicidad:** Un solo endpoint, menos confusión para clientes
✅ **RESTful:** Un recurso = un endpoint principal
✅ **Compatibilidad:** Valores por defecto permiten uso simple

#### 4. **Prevención de Problemas Futuros**

❌ **Sin paginación:**
```bash
# Con 10 registros → OK (1KB)
GET /products

# Con 10,000 registros → ❌ CRASH (10MB+, timeout, OOM)
GET /products
```

✅ **Con paginación por defecto:**
```bash
# Con 10 registros → OK (retorna página 1 con defaults)
GET /products

# Con 10,000 registros → ✅ OK (retorna 20 items, resto paginado)
GET /products
```

---

### 🏗️ Implementación

#### **Request DTO con Valores por Defecto**

```typescript
export class SearchResourceRequest {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1 // ← Default

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20 // ← Default (NOT limit!)

  @IsOptional()
  filters?: Record<string, any>

  @IsOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @IsEnum(['asc', 'desc', 'ASC', 'DESC'])
  orderType?: 'asc' | 'desc'

  toCriteria(): Criteria {
    return Criteria.fromPrimitives({
      filters: this.buildFilters(),
      orderBy: this.orderBy,
      orderType: this.orderType,
      page: this.page || 1,       // ← Fallback
      pageSize: this.pageSize || 20 // ← Fallback
    })
  }
}
```

#### **Controller con Endpoint Único**

```typescript
@Controller('products')
export class ProductsController {
  // ✅ ÚNICO endpoint de listado - SIEMPRE paginado
  @Get()
  async findAll(
    @Query() dto: SearchProductsRequest
  ): Promise<PaginatedProductListResponse> {
    const criteria = dto.toCriteria() // Usa defaults si no hay params
    const query = new SearchProductsByCriteriaQuery(criteria)
    return this.queryBus.execute(query)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponse> {
    const query = new FindProductQuery(id)
    return this.queryBus.execute(query)
  }
}
```

#### **Ejemplos de Uso**

```bash
# Caso 1: Sin parámetros → Usa defaults (page=1, pageSize=20)
GET /products
→ { "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 500, ... } }

# Caso 2: Solo paginación
GET /products?page=3&pageSize=50
→ { "data": [...], "meta": { "page": 3, "pageSize": 50, "total": 500, ... } }

# Caso 3: Con filtros
GET /products?filters[categoryId]=uuid-123&filters[isActive]=true
→ { "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 45, ... } }

# Caso 4: Con ordenamiento
GET /products?orderBy=price&orderType=desc&pageSize=10
→ { "data": [...], "meta": { "page": 1, "pageSize": 10, "total": 500, ... } }

# Caso 5: Combinación completa
GET /products?filters[categoryId]=uuid-123&orderBy=name&orderType=asc&page=2&pageSize=25
→ { "data": [...], "meta": { "page": 2, "pageSize": 25, "total": 45, ... } }
```

---

### 📊 Comparación de Opciones

| Aspecto | Opción A (Dual Endpoints) | Opción B (Unified) ✅ |
|---------|---------------------------|----------------------|
| **Endpoints** | 2 (findAll + search) | 1 (findAll paginado) |
| **Confusión del cliente** | ❌ Alta ("¿Cuál uso?") | ✅ Ninguna |
| **Performance garantizada** | ❌ No (findAll peligroso) | ✅ Sí (siempre paginado) |
| **Escalabilidad** | ❌ Problemas futuros | ✅ Crece bien |
| **Mantenimiento** | ❌ Duplicado | ✅ Un solo flujo |
| **Industry Standard** | ❌ No | ✅ Sí |
| **RESTful** | ⚠️ Confuso | ✅ Claro |
| **Breaking changes** | ❌ Si se depreca uno | ✅ Solo agregar features |

---

### 🎯 Regla de Aplicación: ¿Cuándo Usar Criteria?

#### **SÍ usar Criteria Pattern (con paginación):**

✅ **Módulos con muchos registros:**
- `products` (cientos/miles)
- `orders` (miles)
- `customers` (miles)
- `ingredients` (cientos)
- `inventory-movements` (miles)

**Características:**
- Expected records > 100
- Filtros complejos necesarios
- Ordenamiento dinámico
- Búsqueda de usuarios
- Crecimiento continuo

#### **NO usar Criteria Pattern (searchAll simple):**

❌ **Módulos con pocos registros:**
- `ingredient-categories` (~20)
- `product-categories` (~15)
- `units` (~20)
- `suppliers` (~50)

**Características:**
- Small, bounded domain (< 50 records)
- Static/semi-static data
- Para selects/tabs UI
- Ordenamiento fijo suficiente
- Crecimiento muy bajo

**Implementación simple:**
```typescript
// ✅ Para dominios pequeños - NO necesitas Criteria
@Get()
async findAll(): Promise<CategoryListResponse> {
  const query = new FindAllCategoriesQuery()
  return this.queryBus.execute(query) // Retorna todas (~20 categorías)
}
```

---

### 📝 Regla de Decisión (Decision Tree)

```
¿El módulo tendrá > 100 registros?
│
├─ SÍ → ¿Necesita filtros complejos o búsqueda?
│   │
│   ├─ SÍ → ✅ USA CRITERIA con paginación por defecto
│   │
│   └─ NO → ⚠️ Considera Criteria por escalabilidad futura
│
└─ NO → ¿Necesita ordenamiento dinámico?
    │
    ├─ SÍ → ⚠️ Considera Criteria si hay filtros
    │
    └─ NO → ❌ NO uses Criteria, usa searchAll() simple
```

---

### 🔄 Migración de Endpoints Existentes

Si ya tienes endpoints sin paginación:

#### **Opción 1: Deprecar y Migrar (Recomendado)**

```typescript
@Controller('products')
export class ProductsController {
  // ❌ Endpoint viejo (deprecar)
  @Get('all')
  @Deprecated('Use GET /products instead with optional pagination params')
  async findAllOld(): Promise<ProductListResponse> {
    // Mantener temporalmente para compatibilidad
  }

  // ✅ Nuevo endpoint (siempre paginado)
  @Get()
  async findAll(@Query() dto: SearchProductsRequest): Promise<PaginatedProductListResponse> {
    const criteria = dto.toCriteria()
    const query = new SearchProductsByCriteriaQuery(criteria)
    return this.queryBus.execute(query)
  }
}
```

#### **Opción 2: Versionar API**

```typescript
// v1 (deprecated)
GET /v1/products → Sin paginación

// v2 (current)
GET /v2/products → Con paginación por defecto
```

---

### ✅ Checklist de Implementación

Cuando implementes un endpoint de listado:

- [ ] ¿El módulo tiene/tendrá > 100 registros?
  - Si SÍ → Implementa con Criteria + paginación
  - Si NO → Usa `searchAll()` simple
- [ ] ¿Usas `pageSize` en lugar de `limit`? (lenguaje de negocio)
- [ ] ¿El Request DTO tiene valores por defecto (`page=1`, `pageSize=20`)?
- [ ] ¿La respuesta incluye metadata de paginación?
- [ ] ¿El endpoint funciona sin parámetros? (caso simple)
- [ ] ¿Validaste el `pageSize` máximo? (max: 100)
- [ ] ¿Documentaste los filtros disponibles?

---

### 📚 Referencias

- **Martin Fowler:** [Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/)
- **Google API Design Guide:** [Pagination](https://cloud.google.com/apis/design/design_patterns#list_pagination)
- **Microsoft REST API Guidelines:** [Pagination](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#97-pagination)
- **GitHub API v3:** [Pagination](https://docs.github.com/en/rest/guides/using-pagination-in-the-rest-api)
- **Stripe API:** [List Pagination](https://stripe.com/docs/api/pagination)
- **CodelyTV:** [Pragmatic DDD](https://codely.com/blog/arquitectura/)

---

### 🎯 Decisiones Relacionadas

- **pageSize vs limit:** Ver CLAUDE.md sección 7 "Criteria Pattern"
- **run() vs execute():** Ver CLAUDE.md convenciones de use cases
- **Response DTOs:** Los handlers transforman Domain → DTOs, no los use cases

---

**Última actualización:** 2025-10-24
**Revisado por:** Development Team
**Estado:** Implementado en `ingredient-categories` (ejemplo piloto con Criteria)
