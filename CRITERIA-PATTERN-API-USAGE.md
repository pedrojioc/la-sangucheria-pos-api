# Criteria Pattern - Guía de Uso para Frontend

Esta guía explica cómo usar el patrón Criteria implementado en el backend para realizar búsquedas, filtrados, paginación y ordenamiento desde el frontend.

---

## 📖 Tabla de Contenidos

1. [Operadores Disponibles](#-operadores-disponibles)
2. [Formato de URLs](#-formato-de-urls)
3. [Ejemplos por Categoría](#-ejemplos-por-categoría)
4. [Lista Completa de URLs Válidas](#-lista-completa-de-urls-válidas)
5. [Respuesta del API](#-respuesta-del-api)
6. [Limitaciones Actuales](#-limitaciones-actuales)

---

## 🎯 Operadores Disponibles

El sistema soporta **14 operadores** diferentes para realizar búsquedas complejas:

| Operador | Símbolo | Descripción | SQL Generado | Ejemplo |
|----------|---------|-------------|--------------|---------|
| `EQUAL` | `=` | Igualdad exacta | `field = value` | `filters[isActive]=true` |
| `NOT_EQUAL` | `!=` | Diferente | `field != value` | `filters[status]=!=:inactive` |
| `GT` | `>` | Mayor que | `field > value` | `filters[price]=gt:10` |
| `GTE` | `>=` | Mayor o igual | `field >= value` | `filters[stock]=gte:5` |
| `LT` | `<` | Menor que | `field < value` | `filters[price]=lt:100` |
| `LTE` | `<=` | Menor o igual | `field <= value` | `filters[stock]=lte:99` |
| `CONTAINS` | `contains:` | Contiene (case-insensitive) | `field ILIKE %value%` | `filters[name]=contains:tomate` |
| `NOT_CONTAINS` | `not_contains:` | No contiene | `field NOT ILIKE %value%` | `filters[name]=not_contains:artificial` |
| `STARTS_WITH` | `starts_with:` | Empieza con | `field ILIKE value%` | `filters[name]=starts_with:Que` |
| `ENDS_WITH` | `ends_with:` | Termina con | `field ILIKE %value` | `filters[name]=ends_with:fresco` |
| `IN` | `in:` | En lista de valores | `field IN (val1, val2, ...)` | `filters[categoryId]=in:uuid1,uuid2` |
| `NOT_IN` | `not_in:` | No en lista | `field NOT IN (...)` | `filters[unitId]=not_in:uuid1,uuid2` |
| `IS_NULL` | `is_null` | Es nulo | `field IS NULL` | `filters[description]=is_null` |
| `IS_NOT_NULL` | `is_not_null` | No es nulo | `field IS NOT NULL` | `filters[imageUrl]=is_not_null` |

---

## 🌐 Formato de URLs

### Estructura General

```
GET /[resource]?[paginación]&[ordenamiento]&[filtros]
```

### Parámetros Query

| Parámetro | Tipo | Valores | Por Defecto | Descripción |
|-----------|------|---------|-------------|-------------|
| `page` | number | ≥ 1 | `1` | Número de página |
| `pageSize` | number | 1-100 | `20` | Elementos por página |
| `orderBy` | string | nombre de campo | - | Campo por el que ordenar |
| `orderType` | string | `asc`, `desc`, `ASC`, `DESC` | `asc` | Tipo de ordenamiento |
| `filters[campo]` | any | - | - | Filtro para un campo específico |

---

## 📚 Ejemplos por Categoría

### 1️⃣ Paginación Simple (sin filtros)

```bash
# Página 1, 20 elementos por página (valores por defecto)
GET /ingredients

# Página 2, 10 elementos por página
GET /ingredients?page=2&pageSize=10

# Primera página, 50 elementos
GET /ingredients?pageSize=50

# Última página con 100 elementos máximo
GET /ingredients?page=5&pageSize=100
```

**Casos de uso:**
- Listar todos los ingredientes
- Navegación básica por páginas
- Cambiar tamaño de página en tablas

---

### 2️⃣ Ordenamiento

```bash
# Ordenar por nombre ascendente
GET /ingredients?orderBy=name&orderType=asc

# Ordenar por precio descendente
GET /ingredients?orderBy=unitPrice&orderType=desc

# Ordenar por fecha de creación (más recientes primero)
GET /ingredients?orderBy=createdAt&orderType=DESC

# Ordenar por stock disponible (menor a mayor)
GET /ingredients?orderBy=currentStock&orderType=asc
```

**Casos de uso:**
- Mostrar ingredientes más caros/baratos
- Listar por orden alfabético
- Mostrar registros más recientes
- Ordenar por stock crítico

---

### 3️⃣ Filtros con Igualdad (operador por defecto)

⚠️ **Nota:** Cuando no se especifica operador explícito, se usa `=` (igualdad)

```bash
# Filtrar por ingredientes activos
GET /ingredients?filters[isActive]=true

# Filtrar por unidad específica
GET /ingredients?filters[unitId]=550e8400-e29b-41d4-a716-446655440000

# Filtrar por categoría específica
GET /ingredients?filters[categoryId]=123e4567-e89b-12d3-a456-426614174000

# Múltiples filtros (todos deben cumplirse - AND)
GET /ingredients?filters[isActive]=true&filters[unitId]=550e8400-e29b-41d4-a716-446655440000
```

**Casos de uso:**
- Mostrar solo ingredientes activos
- Filtrar por categoría en un dropdown
- Buscar ingredientes de una unidad específica
- Aplicar múltiples filtros fijos

---

### 4️⃣ Filtros de Comparación Numérica

```bash
# Precio mayor a 10
GET /ingredients?filters[unitPrice]=gt:10

# Precio mayor o igual a 5.50
GET /ingredients?filters[unitPrice]=gte:5.50

# Precio menor a 100
GET /ingredients?filters[unitPrice]=lt:100

# Precio menor o igual a 99.99
GET /ingredients?filters[unitPrice]=lte:99.99

# Stock mayor que cero (en existencia)
GET /ingredients?filters[currentStock]=gt:0

# Stock crítico (menor a 10 unidades)
GET /ingredients?filters[currentStock]=lt:10

# Rango de precios (entre 5 y 20)
GET /ingredients?filters[unitPrice]=gte:5&filters[unitPrice]=lte:20

# Rango de stock (entre 10 y 100 unidades)
GET /ingredients?filters[currentStock]=gte:10&filters[currentStock]=lte:100
```

**Casos de uso:**
- Buscar ingredientes dentro de un rango de precio
- Alertas de stock crítico
- Filtrar por disponibilidad
- Reportes por rangos de valores

---

### 5️⃣ Filtros de Texto

```bash
# Buscar ingredientes cuyo nombre CONTIENE "tomate"
GET /ingredients?filters[name]=contains:tomate

# Ingredientes cuyo nombre NO CONTIENE "artificial"
GET /ingredients?filters[name]=not_contains:artificial

# Ingredientes cuyo nombre EMPIEZA CON "Que"
GET /ingredients?filters[name]=starts_with:Que

# Ingredientes cuyo nombre TERMINA CON "fresco"
GET /ingredients?filters[name]=ends_with:fresco

# Buscar en descripción
GET /ingredients?filters[description]=contains:orgánico

# Buscar en múltiples campos
GET /ingredients?filters[name]=contains:queso&filters[description]=contains:italiano
```

**Casos de uso:**
- Barra de búsqueda en tiempo real
- Autocompletar nombres
- Filtros de texto en tablas
- Búsqueda por palabras clave

---

### 6️⃣ Filtros con Listas (IN / NOT_IN)

```bash
# Ingredientes de múltiples categorías (separados por coma)
GET /ingredients?filters[categoryId]=in:uuid1,uuid2,uuid3

# Excluir ciertas unidades
GET /ingredients?filters[unitId]=not_in:uuid1,uuid2

# Ingredientes con IDs específicos
GET /ingredients?filters[id]=in:id1,id2,id3

# Excluir ingredientes específicos
GET /ingredients?filters[id]=not_in:id-exclude1,id-exclude2
```

**Casos de uso:**
- Selección múltiple de categorías
- Excluir ciertos elementos
- Filtrar por múltiples valores de un dropdown
- Comparación de conjuntos de datos

---

### 7️⃣ Filtros NULL / NOT NULL

```bash
# Ingredientes sin descripción
GET /ingredients?filters[description]=is_null

# Ingredientes con imagen
GET /ingredients?filters[imageUrl]=is_not_null

# Ingredientes sin imagen
GET /ingredients?filters[imageUrl]=is_null

# Ingredientes con descripción
GET /ingredients?filters[description]=is_not_null
```

**Casos de uso:**
- Encontrar registros incompletos
- Validar datos faltantes
- Filtrar por campos opcionales rellenos/vacíos

---

### 8️⃣ Combinaciones Complejas

```bash
# Buscar "queso", activos, ordenados por precio, página 2
GET /ingredients?filters[name]=contains:queso&filters[isActive]=true&orderBy=unitPrice&orderType=asc&page=2&pageSize=15

# Ingredientes de categoría específica, con stock > 0, más recientes primero
GET /ingredients?filters[categoryId]=uuid-category&filters[currentStock]=gt:0&orderBy=createdAt&orderType=DESC&pageSize=50

# Búsqueda compleja: nombre empieza con "C", precio entre 5 y 20, activos
GET /ingredients?filters[name]=starts_with:C&filters[unitPrice]=gte:5&filters[unitPrice]=lte:20&filters[isActive]=true

# Ingredientes con imagen, stock crítico, ordenados por stock
GET /ingredients?filters[imageUrl]=is_not_null&filters[currentStock]=lt:10&orderBy=currentStock&orderType=asc

# Búsqueda de texto + múltiples categorías + rango de precio
GET /ingredients?filters[name]=contains:carne&filters[categoryId]=in:uuid1,uuid2&filters[unitPrice]=lte:50&orderBy=name&orderType=asc&page=1&pageSize=25
```

**Casos de uso:**
- Búsquedas avanzadas con múltiples criterios
- Dashboards con filtros complejos
- Reportes personalizados
- Interfaces de administración

---

## 📋 Lista Completa de URLs Válidas

### Paginación

```bash
GET /ingredients
GET /ingredients?page=1
GET /ingredients?page=2&pageSize=10
GET /ingredients?pageSize=50
GET /ingredients?page=3&pageSize=25
```

### Ordenamiento

```bash
GET /ingredients?orderBy=name&orderType=asc
GET /ingredients?orderBy=name&orderType=desc
GET /ingredients?orderBy=unitPrice&orderType=asc
GET /ingredients?orderBy=unitPrice&orderType=desc
GET /ingredients?orderBy=currentStock&orderType=asc
GET /ingredients?orderBy=createdAt&orderType=DESC
GET /ingredients?orderBy=updatedAt&orderType=DESC
```

### Filtros - Igualdad

```bash
GET /ingredients?filters[isActive]=true
GET /ingredients?filters[isActive]=false
GET /ingredients?filters[categoryId]=uuid-here
GET /ingredients?filters[unitId]=uuid-here
GET /ingredients?filters[name]=Queso Mozzarella
```

### Filtros - Comparación

```bash
GET /ingredients?filters[unitPrice]=gt:10
GET /ingredients?filters[unitPrice]=gte:5.50
GET /ingredients?filters[unitPrice]=lt:100
GET /ingredients?filters[unitPrice]=lte:99.99
GET /ingredients?filters[currentStock]=gt:0
GET /ingredients?filters[currentStock]=lt:10
GET /ingredients?filters[currentStock]=gte:10
GET /ingredients?filters[currentStock]=lte:100
```

### Filtros - Texto

```bash
GET /ingredients?filters[name]=contains:tomate
GET /ingredients?filters[name]=contains:queso
GET /ingredients?filters[name]=not_contains:artificial
GET /ingredients?filters[name]=starts_with:Que
GET /ingredients?filters[name]=starts_with:C
GET /ingredients?filters[name]=ends_with:fresco
GET /ingredients?filters[description]=contains:orgánico
GET /ingredients?filters[description]=contains:importado
```

### Filtros - Listas

```bash
GET /ingredients?filters[categoryId]=in:uuid1,uuid2,uuid3
GET /ingredients?filters[unitId]=in:uuid1,uuid2
GET /ingredients?filters[id]=in:id1,id2,id3
GET /ingredients?filters[unitId]=not_in:uuid1,uuid2
GET /ingredients?filters[categoryId]=not_in:uuid1
```

### Filtros - NULL

```bash
GET /ingredients?filters[description]=is_null
GET /ingredients?filters[imageUrl]=is_null
GET /ingredients?filters[imageUrl]=is_not_null
GET /ingredients?filters[description]=is_not_null
```

### Combinaciones Complejas

```bash
# Búsqueda con texto + filtro booleano + ordenamiento
GET /ingredients?filters[name]=contains:queso&filters[isActive]=true&orderBy=name&orderType=asc&page=1&pageSize=20

# Filtro por categoría + stock + precio + ordenamiento
GET /ingredients?filters[categoryId]=uuid&filters[currentStock]=gt:0&filters[unitPrice]=lte:50&orderBy=unitPrice&orderType=asc

# Búsqueda compleja con rangos
GET /ingredients?filters[name]=starts_with:C&filters[isActive]=true&filters[unitPrice]=gte:5&filters[unitPrice]=lte:20&orderBy=createdAt&orderType=DESC&page=1&pageSize=25

# Filtro con imagen + stock crítico + ordenamiento
GET /ingredients?filters[imageUrl]=is_not_null&filters[currentStock]=lt:10&orderBy=currentStock&orderType=asc&pageSize=50

# Múltiples categorías + texto + precio
GET /ingredients?filters[name]=contains:carne&filters[categoryId]=in:uuid1,uuid2&filters[unitPrice]=lte:50&orderBy=name&orderType=asc
```

---

## 🎯 Respuesta del API

### Formato de Respuesta

Todas las peticiones con el patrón Criteria devuelven este formato estandarizado:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Queso Mozzarella",
      "description": "Queso fresco italiano de alta calidad",
      "unitPrice": 15.50,
      "currentStock": 100,
      "minStock": 10,
      "maxStock": 200,
      "isActive": true,
      "categoryId": "123e4567-e89b-12d3-a456-426614174000",
      "categoryName": "Lácteos",
      "unitId": "987fbc97-4bed-5078-9f07-9141ba07c9f3",
      "unitName": "Kilogramo",
      "unitSymbol": "kg",
      "imageUrl": "https://example.com/queso.jpg",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Tomate Fresco",
      "description": "Tomate orgánico",
      "unitPrice": 8.00,
      "currentStock": 50,
      "minStock": 20,
      "maxStock": 100,
      "isActive": true,
      "categoryId": "234e5678-e89b-12d3-a456-426614174001",
      "categoryName": "Verduras",
      "unitId": "a87fbc97-4bed-5078-9f07-9141ba07c9f4",
      "unitName": "Kilogramo",
      "unitSymbol": "kg",
      "imageUrl": null,
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-18T16:30:00Z"
    }
  ],
  "meta": {
    "total": 150,           // Total de registros que cumplen los criterios
    "page": 2,              // Página actual
    "pageSize": 20,         // Elementos por página
    "totalPages": 8,        // Total de páginas disponibles
    "hasNextPage": true,    // ¿Hay página siguiente?
    "hasPreviousPage": true // ¿Hay página anterior?
  }
}
```

### Campos de Metadata

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | number | Total de registros que cumplen los criterios de búsqueda |
| `page` | number | Número de página actual (1-indexed) |
| `pageSize` | number | Cantidad de elementos por página |
| `totalPages` | number | Total de páginas disponibles |
| `hasNextPage` | boolean | Indica si existe una página siguiente |
| `hasPreviousPage` | boolean | Indica si existe una página anterior |

### Respuesta Vacía

Cuando no hay resultados:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## ⚠️ Limitaciones Actuales

### Operadores No Implementados en Request DTO

**IMPORTANTE:** La implementación actual de `SearchIngredientsRequest.buildFilters()` **NO parsea automáticamente los operadores** de los valores en la query string.

#### Código Actual (Limitado)

```typescript
// src/contexts/inventory/ingredient/presentation/http/dto/search-ingredients.request.ts
private buildFilters(): Array<{ field: string; operator: string; value: any }> {
  if (!this.filters) {
    return []
  }

  return Object.entries(this.filters).map(([field, value]) => ({
    field,
    operator: '=',  // ⚠️ SIEMPRE usa igualdad
    value
  }))
}
```

#### Consecuencias

- ✅ **Funcionan:** Filtros de igualdad (`filters[isActive]=true`)
- ❌ **NO funcionan todavía:** Operadores avanzados (`filters[name]=contains:tomate`)

### Solución Futura

Para habilitar todos los operadores, se necesita implementar el parsing de operadores:

```typescript
private buildFilters(): Array<{ field: string; operator: string; value: any }> {
  if (!this.filters) {
    return []
  }

  return Object.entries(this.filters).map(([field, rawValue]) => {
    // Parsear operador si viene en formato "operator:value"
    const match = String(rawValue).match(/^(contains|not_contains|starts_with|ends_with|gt|gte|lt|lte|in|not_in|is_null|is_not_null):(.*)$/)

    if (match) {
      const [, operatorStr, value] = match
      const operator = this.mapOperator(operatorStr)
      const parsedValue = operator === 'IN' || operator === 'NOT_IN'
        ? value.split(',')
        : value

      return { field, operator, value: parsedValue }
    }

    // Si no hay operador, usar igualdad
    return { field, operator: '=', value: rawValue }
  })
}

private mapOperator(op: string): string {
  const mapping: Record<string, string> = {
    'contains': 'CONTAINS',
    'not_contains': 'NOT_CONTAINS',
    'starts_with': 'STARTS_WITH',
    'ends_with': 'ENDS_WITH',
    'gt': '>',
    'gte': '>=',
    'lt': '<',
    'lte': '<=',
    'in': 'IN',
    'not_in': 'NOT_IN',
    'is_null': 'IS_NULL',
    'is_not_null': 'IS_NOT_NULL'
  }
  return mapping[op] || '='
}
```

### Workaround Actual

Por ahora, solo usa filtros de igualdad:

```bash
# ✅ Funciona actualmente
GET /ingredients?filters[isActive]=true
GET /ingredients?filters[categoryId]=uuid-here

# ❌ No funciona todavía (requiere implementación del parsing)
GET /ingredients?filters[name]=contains:tomate
```

---

## 🔗 Referencias

- **Implementación Backend:** `src/shared/domain/criteria/`
- **Converter TypeORM:** `src/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter.ts`
- **Request DTO Ejemplo:** `src/contexts/inventory/ingredient/presentation/http/dto/search-ingredients.request.ts`
- **Documentación Arquitectura:** `CLAUDE.md` (sección "Criteria Pattern")

---

**Última Actualización:** 2025-11-19
**Versión:** 1.0.0
