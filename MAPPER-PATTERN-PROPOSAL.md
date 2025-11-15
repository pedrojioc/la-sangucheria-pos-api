# Mapper Pattern Proposal

## 📋 Propuesta de Implementación del Patrón Mapper

**Fecha:** 2025-01-22
**Estado:** Propuesta para implementación futura
**Arquitectura:** Onion Architecture + DDD

---

## 🎯 Objetivo

Implementar el patrón Mapper para transformar objetos de dominio a DTOs de respuesta, manteniendo la pureza de los Use Cases y respetando la **Dependency Rule** de Onion Architecture.

---

## ⚠️ Problema Actual

**Opción actual:**
```typescript
// Use Case retorna DTO directamente
export class FindIngredientCategory {
  async execute(id: string): Promise<IngredientCategoryResponse> {
    const category = await this.repository.findById(new IngredientCategoryId(id))
    if (!category) throw new IngredientCategoryNotExist(id)

    return new IngredientCategoryResponse(category.toPrimitives())
  }
}
```

**Problemas:**
- ❌ Use Case conoce el formato de presentación (acoplamiento)
- ❌ Difícil reutilizar el Use Case en otros contextos (GraphQL, gRPC, CLI)
- ❌ Lógica de transformación mezclada con lógica de negocio

---

## ✅ Solución Propuesta: Mapper Pattern

### **Principio Fundamental**

> **Los Mappers pertenecen a la Application Layer, NO a Presentation**

**Flujo de dependencias (Onion Architecture):**
```
Presentation → Application → Domain

✅ CORRECTO:
Presentation (Controller)
  → Application (Handler usa Mapper)
    → Application (Use Case retorna Domain)
      → Domain (Aggregate)

❌ INCORRECTO:
Application (Handler) → Presentation (Mapper) ← Violación!
```

---

## 📂 Estructura de Archivos Propuesta

```
src/modules/ingredient-categories/
├── domain/
│   ├── ingredient-category.ts                    # Aggregate Root
│   ├── ingredient-category-id.ts                 # Value Object
│   ├── ingredient-category-name.ts               # Value Object
│   ├── events/
│   │   └── ingredient-category-created.event.ts
│   ├── exceptions/
│   │   └── ingredient-category-not-exist.ts
│   └── repositories/
│       └── ingredient-category.repository.ts     # Interface
│
├── application/
│   ├── dto/                                       # ← Response DTOs
│   │   ├── ingredient-category.response.ts
│   │   └── ingredient-category-list.response.ts
│   │
│   ├── mappers/                                   # ← MAPPERS ✅
│   │   └── ingredient-category.mapper.ts
│   │
│   ├── create/
│   │   ├── create-ingredient-category.ts         # Use Case (pure)
│   │   ├── create-ingredient-category.command.ts # Command (POJO)
│   │   └── create-ingredient-category.handler.ts # Handler
│   │
│   ├── update/
│   │   ├── update-ingredient-category.ts
│   │   ├── update-ingredient-category.command.ts
│   │   └── update-ingredient-category.handler.ts
│   │
│   ├── delete/
│   │   ├── delete-ingredient-category.ts
│   │   ├── delete-ingredient-category.command.ts
│   │   └── delete-ingredient-category.handler.ts
│   │
│   ├── find/
│   │   ├── find-ingredient-category.ts           # Use Case retorna Domain
│   │   ├── find-ingredient-category.query.ts
│   │   └── find-ingredient-category.handler.ts   # Handler usa Mapper
│   │
│   └── find-all/
│       ├── find-all-ingredient-category.ts
│       ├── find-all-ingredient-category.query.ts
│       └── find-all-ingredient-category.handler.ts
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── ingredient-category.entity.ts      # TypeORM Entity
│           └── typeorm-ingredient-category.repository.ts
│
└── presentation/
    └── http/
        ├── controllers/
        │   └── ingredient-category.controller.ts  # Controller (usa QueryBus)
        └── dto/
            ├── create-ingredient-category.dto.ts  # Request DTO
            └── update-ingredient-category.dto.ts  # Request DTO
```

---

## 🔧 Implementación Detallada

### **1. Response DTOs (Application Layer)**

```typescript
// 📁 application/dto/ingredient-category.response.ts
export class IngredientCategoryResponse {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sortOrden: number | null
  isActive: boolean
}
```

```typescript
// 📁 application/dto/ingredient-category-list.response.ts
import { IngredientCategoryResponse } from './ingredient-category.response'

export class IngredientCategoryListResponse {
  categories: IngredientCategoryResponse[]
}
```

---

### **2. Mapper (Application Layer)**

```typescript
// 📁 application/mappers/ingredient-category.mapper.ts
import { IngredientCategory } from '../../domain/ingredient-category'
import { IngredientCategoryResponse } from '../dto/ingredient-category.response'
import { IngredientCategoryListResponse } from '../dto/ingredient-category-list.response'

export class IngredientCategoryMapper {
  /**
   * Mapea un agregado de dominio a un DTO de respuesta
   * @param category Agregado de dominio
   * @returns DTO de respuesta para la capa de presentación
   */
  static toResponse(category: IngredientCategory): IngredientCategoryResponse {
    const primitives = category.toPrimitives()

    return {
      id: primitives.id,
      name: primitives.name,
      description: primitives.description,
      icon: primitives.icon,
      color: primitives.color,
      sortOrden: primitives.sortOrden,
      isActive: primitives.isActive
    }
  }

  /**
   * Mapea una lista de agregados de dominio a un DTO de lista
   * @param categories Array de agregados de dominio
   * @returns DTO de lista para la capa de presentación
   */
  static toListResponse(categories: IngredientCategory[]): IngredientCategoryListResponse {
    return {
      categories: categories.map(category => this.toResponse(category))
    }
  }
}
```

---

### **3. Use Cases (Application Layer - Puros)**

#### **Query Use Case (retorna Domain)**

```typescript
// 📁 application/find/find-ingredient-category.ts
import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'
import { IngredientCategory } from '../../domain/ingredient-category'
import { IngredientCategoryId } from '../../domain/ingredient-category-id'
import { IngredientCategoryNotExist } from '../../domain/exceptions/ingredient-category-not-exist'

/**
 * Use Case puro: retorna el agregado de dominio
 * No conoce DTOs de respuesta (máxima reutilización)
 */
export class FindIngredientCategory {
  constructor(private readonly repository: IngredientCategoryRepository) {}

  async execute(id: string): Promise<IngredientCategory> {
    const categoryId = new IngredientCategoryId(id)
    const category = await this.repository.findById(categoryId)

    if (!category) {
      throw new IngredientCategoryNotExist(id)
    }

    return category // ← Retorna dominio puro
  }
}
```

```typescript
// 📁 application/find-all/find-all-ingredient-category.ts
import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'
import { IngredientCategory } from '../../domain/ingredient-category'

export class FindAllIngredientCategory {
  constructor(private readonly repository: IngredientCategoryRepository) {}

  async execute(): Promise<IngredientCategory[]> {
    return this.repository.findAll() // ← Retorna array de dominio
  }
}
```

#### **Command Use Case (retorna void)**

```typescript
// 📁 application/create/create-ingredient-category.ts
import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { IngredientCategory } from '../../domain/ingredient-category'

/**
 * Use Case de escritura: retorna void
 * Crea el agregado y publica eventos
 */
export class CreateIngredientCategory {
  constructor(
    private readonly repository: IngredientCategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(
    id: string,
    name: string,
    description: string | null,
    icon: string | null,
    color: string | null,
    sortOrden: number | null,
    isActive: boolean
  ): Promise<void> {
    const category = IngredientCategory.create(
      id,
      name,
      description,
      icon,
      color,
      sortOrden,
      isActive
    )

    await this.repository.save(category)

    const events = category.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
```

---

### **4. Handlers (Application Layer - Adaptadores CQRS)**

#### **Query Handler (usa Mapper)**

```typescript
// 📁 application/find/find-ingredient-category.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindIngredientCategoryQuery } from './find-ingredient-category.query'
import { FindIngredientCategory } from './find-ingredient-category'
import { IngredientCategoryResponse } from '../dto/ingredient-category.response'
import { IngredientCategoryMapper } from '../mappers/ingredient-category.mapper'

/**
 * Handler: adaptador entre CQRS y Application Layer
 * Responsabilidad: transformar dominio → DTO usando Mapper
 */
@QueryHandler(FindIngredientCategoryQuery)
export class FindIngredientCategoryHandler
  implements IQueryHandler<FindIngredientCategoryQuery, IngredientCategoryResponse> {

  constructor(private readonly useCase: FindIngredientCategory) {}

  async execute(query: FindIngredientCategoryQuery): Promise<IngredientCategoryResponse> {
    // 1. Ejecuta Use Case (obtiene dominio)
    const category = await this.useCase.execute(query.id)

    // 2. Usa Mapper para transformar a DTO
    return IngredientCategoryMapper.toResponse(category)
  }
}
```

```typescript
// 📁 application/find-all/find-all-ingredient-category.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindAllIngredientCategoryQuery } from './find-all-ingredient-category.query'
import { FindAllIngredientCategory } from './find-all-ingredient-category'
import { IngredientCategoryListResponse } from '../dto/ingredient-category-list.response'
import { IngredientCategoryMapper } from '../mappers/ingredient-category.mapper'

@QueryHandler(FindAllIngredientCategoryQuery)
export class FindAllIngredientCategoryHandler
  implements IQueryHandler<FindAllIngredientCategoryQuery, IngredientCategoryListResponse> {

  constructor(private readonly useCase: FindAllIngredientCategory) {}

  async execute(): Promise<IngredientCategoryListResponse> {
    const categories = await this.useCase.execute()
    return IngredientCategoryMapper.toListResponse(categories)
  }
}
```

#### **Command Handler (no usa Mapper)**

```typescript
// 📁 application/create/create-ingredient-category.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateIngredientCategoryCommand } from './create-ingredient-category.command'
import { CreateIngredientCategory } from './create-ingredient-category'

/**
 * Handler para comandos: solo ejecuta el Use Case
 * No necesita Mapper porque retorna void
 */
@CommandHandler(CreateIngredientCategoryCommand)
export class CreateIngredientCategoryCommandHandler
  implements ICommandHandler<CreateIngredientCategoryCommand> {

  constructor(private readonly useCase: CreateIngredientCategory) {}

  async execute(command: CreateIngredientCategoryCommand): Promise<void> {
    return this.useCase.execute(
      command.id,
      command.name,
      command.description,
      command.icon,
      command.color,
      command.sortOrden,
      command.isActive
    )
  }
}
```

---

### **5. Controllers (Presentation Layer)**

```typescript
// 📁 presentation/http/controllers/ingredient-category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateIngredientCategoryDto } from '../dto/create-ingredient-category.dto'
import { UpdateIngredientCategoryDto } from '../dto/update-ingredient-category.dto'
import { CreateIngredientCategoryCommand } from '@/modules/ingredient-categories/application/create/create-ingredient-category.command'
import { UpdateIngredientCategoryCommand } from '@/modules/ingredient-categories/application/update/update-ingredient-category.command'
import { DeleteIngredientCategoryCommand } from '@/modules/ingredient-categories/application/delete/delete-ingredient-category.command'
import { FindIngredientCategoryQuery } from '@/modules/ingredient-categories/application/find/find-ingredient-category.query'
import { FindAllIngredientCategoryQuery } from '@/modules/ingredient-categories/application/find-all/find-all-ingredient-category.query'
import { IngredientCategoryResponse } from '@/modules/ingredient-categories/application/dto/ingredient-category.response'
import { IngredientCategoryListResponse } from '@/modules/ingredient-categories/application/dto/ingredient-category-list.response'

/**
 * Controller: capa de presentación HTTP
 * Responsabilidad: routing, validación, delegación a CQRS
 * NO conoce el dominio, solo Commands/Queries y DTOs
 */
@Controller('ingredient-categories')
export class IngredientCategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateIngredientCategoryDto): Promise<void> {
    // Mapeo simple Request DTO → Command (puede estar aquí o en un helper)
    const command = new CreateIngredientCategoryCommand(
      dto.id,
      dto.name,
      dto.description || null,
      dto.icon || null,
      dto.color || null,
      dto.sortOrden || null,
      dto.isActive
    )

    await this.commandBus.execute(command)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientCategoryDto
  ): Promise<void> {
    const command = new UpdateIngredientCategoryCommand(
      id,
      dto.name,
      dto.description || null,
      dto.icon || null,
      dto.color || null,
      dto.sortOrden || null,
      dto.isActive
    )

    await this.commandBus.execute(command)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteIngredientCategoryCommand(id)
    await this.commandBus.execute(command)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<IngredientCategoryResponse> {
    const query = new FindIngredientCategoryQuery(id)
    return this.queryBus.execute(query) // ← Handler ya devuelve Response mapeado
  }

  @Get()
  async findAll(): Promise<IngredientCategoryListResponse> {
    const query = new FindAllIngredientCategoryQuery()
    return this.queryBus.execute(query) // ← Handler ya devuelve Response mapeado
  }
}
```

---

## 🔄 Flujo de Datos Completo

### **Query Flow (GET)**

```
1. HTTP Request
   GET /ingredient-categories/123
   ↓
2. Controller
   new FindIngredientCategoryQuery('123')
   → queryBus.execute(query)
   ↓
3. Handler (FindIngredientCategoryHandler)
   → useCase.execute('123')
   ↓
4. Use Case (FindIngredientCategory)
   → repository.findById(id)
   → returns IngredientCategory (domain)
   ↓
5. Handler
   → IngredientCategoryMapper.toResponse(category)
   → returns IngredientCategoryResponse (DTO)
   ↓
6. Controller
   → returns Response to client
   ↓
7. HTTP Response
   { "id": "123", "name": "...", ... }
```

### **Command Flow (POST)**

```
1. HTTP Request
   POST /ingredient-categories
   { "id": "123", "name": "...", ... }
   ↓
2. Controller
   new CreateIngredientCategoryCommand(...)
   → commandBus.execute(command)
   ↓
3. Handler (CreateIngredientCategoryCommandHandler)
   → useCase.execute(...)
   ↓
4. Use Case (CreateIngredientCategory)
   → IngredientCategory.create(...)
   → repository.save(category)
   → eventBus.publish(events)
   → returns void
   ↓
5. HTTP Response
   201 Created (no body)
```

---

## ✨ Ventajas del Patrón

### **1. Separación de Responsabilidades**

| Capa | Responsabilidad |
|------|----------------|
| **Domain** | Lógica de negocio pura |
| **Use Case** | Orquestación de lógica de aplicación |
| **Handler** | Adaptación CQRS + transformación Domain → DTO |
| **Mapper** | Transformación de datos |
| **Controller** | Routing HTTP + validación |

### **2. Reutilización de Use Cases**

El mismo Use Case puede usarse en diferentes contextos:

```typescript
// HTTP REST
const category = await useCase.execute(id)
return IngredientCategoryMapper.toResponse(category)

// GraphQL
const category = await useCase.execute(id)
return GraphQLMapper.toCategoryType(category)

// CLI
const category = await useCase.execute(id)
console.log(CLIFormatter.format(category))

// gRPC
const category = await useCase.execute(id)
return GrpcMapper.toProtoMessage(category)
```

### **3. Testabilidad**

#### **Test del Use Case (puro)**
```typescript
describe('FindIngredientCategory', () => {
  it('should find category by id', async () => {
    const category = IngredientCategoryMother.create()
    repository.findById.mockResolvedValue(category)

    const result = await useCase.execute(category.id.value)

    expect(result).toBe(category) // ← Retorna dominio
    expect(result).toBeInstanceOf(IngredientCategory)
  })
})
```

#### **Test del Mapper (aislado)**
```typescript
describe('IngredientCategoryMapper', () => {
  it('should map domain to response', () => {
    const category = IngredientCategoryMother.create()

    const response = IngredientCategoryMapper.toResponse(category)

    expect(response.id).toBe(category.id.value)
    expect(response.name).toBe(category.toPrimitives().name)
    expect(response).not.toHaveProperty('pullDomainEvents') // ← Es DTO, no dominio
  })
})
```

#### **Test del Handler (integración)**
```typescript
describe('FindIngredientCategoryHandler', () => {
  it('should return mapped response', async () => {
    const category = IngredientCategoryMother.create()
    useCase.execute.mockResolvedValue(category)

    const result = await handler.execute(new FindIngredientCategoryQuery('123'))

    expect(result).toBeInstanceOf(IngredientCategoryResponse)
    expect(result.id).toBe(category.id.value)
  })
})
```

### **4. Mantenibilidad**

**Cambio de formato de respuesta:**
```typescript
// Solo modificas el Mapper, todo lo demás permanece igual
static toResponse(category: IngredientCategory): IngredientCategoryResponse {
  const primitives = category.toPrimitives()

  return {
    id: primitives.id,
    name: primitives.name,
    // ✨ Agregar campo calculado
    displayName: `${primitives.name} (${primitives.isActive ? 'Active' : 'Inactive'})`,
    // ✨ Formatear datos
    color: primitives.color?.toUpperCase() || '#FFFFFF',
    // ... resto de campos
  }
}
```

### **5. Escalabilidad**

Fácil agregar nuevos formatos de salida:

```typescript
export class IngredientCategoryMapper {
  // Formato estándar
  static toResponse(category: IngredientCategory): IngredientCategoryResponse { }

  // Formato resumido (para listas)
  static toSummary(category: IngredientCategory): IngredientCategorySummary {
    return {
      id: category.id.value,
      name: category.toPrimitives().name
    }
  }

  // Formato detallado (con relaciones)
  static toDetailedResponse(
    category: IngredientCategory,
    ingredientCount: number
  ): IngredientCategoryDetailedResponse {
    return {
      ...this.toResponse(category),
      ingredientCount,
      lastModified: new Date()
    }
  }
}
```

---

## 🎯 Reglas de Implementación

### **✅ DO (Hacer)**

1. **Mappers en Application Layer**
   ```typescript
   // ✅ application/mappers/
   import { IngredientCategory } from '../../domain/ingredient-category'
   import { Response } from '../dto/response'
   ```

2. **Use Cases retornan Domain**
   ```typescript
   // ✅ Queries retornan agregados
   async execute(id: string): Promise<IngredientCategory>

   // ✅ Commands retornan void
   async execute(...): Promise<void>
   ```

3. **Handlers usan Mappers**
   ```typescript
   // ✅ Handler transforma Domain → DTO
   async execute(query: Query): Promise<Response> {
     const domain = await this.useCase.execute(query.id)
     return Mapper.toResponse(domain)
   }
   ```

4. **Métodos estáticos en Mappers**
   ```typescript
   // ✅ No state, solo transformaciones
   export class Mapper {
     static toResponse(domain: Domain): Response { }
   }
   ```

### **❌ DON'T (No Hacer)**

1. **Mappers en Presentation**
   ```typescript
   // ❌ presentation/mappers/ ← WRONG!
   // Viola Dependency Rule
   ```

2. **Use Cases retornan DTOs**
   ```typescript
   // ❌ Acoplamiento a capa externa
   async execute(id: string): Promise<Response>
   ```

3. **Transformación en Controller**
   ```typescript
   // ❌ Controller no debe conocer dominio
   const category = await useCase.execute(id)
   return new Response(category.toPrimitives())
   ```

4. **Mappers con estado**
   ```typescript
   // ❌ Mappers deben ser stateless
   export class Mapper {
     constructor(private config: Config) { }
   }
   ```

---

## 📊 Comparación con Implementación Actual

| Aspecto | Implementación Actual | Con Mapper Pattern |
|---------|----------------------|-------------------|
| **Pureza Use Case** | ⚠️ Media (conoce DTOs) | ✅ Alta (solo dominio) |
| **Reutilización** | ⚠️ Limitada | ✅ Máxima (multi-contexto) |
| **Testabilidad** | ✅ Buena | ✅ Excelente (aislada) |
| **Mantenibilidad** | ⚠️ Media | ✅ Alta (punto único cambio) |
| **Complejidad** | ✅ Baja | ⚠️ Media (+1 capa) |
| **Escalabilidad** | ⚠️ Media | ✅ Alta (múltiples formatos) |
| **Dependency Rule** | ✅ Respeta | ✅ Respeta estrictamente |

---

## 🚀 Plan de Migración

### **Fase 1: Preparación**
1. Crear estructura de directorios `application/mappers/`
2. Crear DTOs de respuesta si no existen
3. Documentar patrón en CLAUDE.md

### **Fase 2: Implementación Incremental**
1. Empezar con un módulo pequeño (ej: `units`)
2. Crear Mapper
3. Refactorizar Use Case para retornar Domain
4. Actualizar Handler para usar Mapper
5. Validar con tests

### **Fase 3: Extensión**
1. Aplicar a módulos restantes
2. Crear Mappers compartidos si es necesario
3. Estandarizar formatos de respuesta

### **Fase 4: Optimización**
1. Agregar mappers adicionales (summary, detailed, etc.)
2. Implementar caching si es necesario
3. Monitorear performance

---

## 📝 Checklist de Implementación

Para cada módulo que implemente este patrón:

- [ ] Crear `application/mappers/{module}.mapper.ts`
- [ ] Crear DTOs de respuesta en `application/dto/`
- [ ] Refactorizar Use Case para retornar Domain (queries)
- [ ] Actualizar Handler para usar Mapper
- [ ] Eliminar lógica de transformación del Use Case
- [ ] Escribir tests para Mapper
- [ ] Actualizar tests de Use Case (ahora retorna Domain)
- [ ] Actualizar tests de Handler
- [ ] Verificar que Controller funciona correctamente
- [ ] Documentar en código con comentarios JSDoc

---

## 🧪 Ejemplo de Tests

### **Mapper Test**
```typescript
// tests/modules/ingredient-categories/application/IngredientCategoryMapper.spec.ts
import { IngredientCategoryMapper } from '@/modules/ingredient-categories/application/mappers/ingredient-category.mapper'
import { IngredientCategoryMother } from '../../__mothers__/IngredientCategoryMother'

describe('IngredientCategoryMapper', () => {
  describe('toResponse', () => {
    it('should map domain aggregate to response DTO', () => {
      const category = IngredientCategoryMother.create({
        id: '123',
        name: 'Carnes',
        description: 'Proteínas',
        isActive: true
      })

      const response = IngredientCategoryMapper.toResponse(category)

      expect(response).toEqual({
        id: '123',
        name: 'Carnes',
        description: 'Proteínas',
        icon: null,
        color: null,
        sortOrden: null,
        isActive: true
      })
    })

    it('should handle null optional fields', () => {
      const category = IngredientCategoryMother.create({
        description: null,
        icon: null,
        color: null,
        sortOrden: null
      })

      const response = IngredientCategoryMapper.toResponse(category)

      expect(response.description).toBeNull()
      expect(response.icon).toBeNull()
      expect(response.color).toBeNull()
      expect(response.sortOrden).toBeNull()
    })
  })

  describe('toListResponse', () => {
    it('should map array of aggregates to list response', () => {
      const categories = [
        IngredientCategoryMother.create({ name: 'Carnes' }),
        IngredientCategoryMother.create({ name: 'Verduras' })
      ]

      const response = IngredientCategoryMapper.toListResponse(categories)

      expect(response.categories).toHaveLength(2)
      expect(response.categories[0].name).toBe('Carnes')
      expect(response.categories[1].name).toBe('Verduras')
    })
  })
})
```

### **Use Case Test**
```typescript
// tests/modules/ingredient-categories/application/FindIngredientCategory.spec.ts
import { FindIngredientCategory } from '@/modules/ingredient-categories/application/find/find-ingredient-category'
import { IngredientCategoryRepository } from '@/modules/ingredient-categories/domain/repositories/ingredient-category.repository'
import { IngredientCategoryMother } from '../../__mothers__/IngredientCategoryMother'
import { IngredientCategory } from '@/modules/ingredient-categories/domain/ingredient-category'

describe('FindIngredientCategory', () => {
  let useCase: FindIngredientCategory
  let repository: jest.Mocked<IngredientCategoryRepository>

  beforeEach(() => {
    repository = {
      findById: jest.fn()
    } as any

    useCase = new FindIngredientCategory(repository)
  })

  it('should return domain aggregate', async () => {
    const category = IngredientCategoryMother.create()
    repository.findById.mockResolvedValue(category)

    const result = await useCase.execute(category.id.value)

    expect(result).toBe(category)
    expect(result).toBeInstanceOf(IngredientCategory)
  })

  it('should throw when category not found', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.execute('non-existent'))
      .rejects
      .toThrow('Ingredient category with id non-existent does not exist')
  })
})
```

### **Handler Test**
```typescript
// tests/modules/ingredient-categories/application/FindIngredientCategoryHandler.spec.ts
import { FindIngredientCategoryHandler } from '@/modules/ingredient-categories/application/find/find-ingredient-category.handler'
import { FindIngredientCategory } from '@/modules/ingredient-categories/application/find/find-ingredient-category'
import { FindIngredientCategoryQuery } from '@/modules/ingredient-categories/application/find/find-ingredient-category.query'
import { IngredientCategoryResponse } from '@/modules/ingredient-categories/application/dto/ingredient-category.response'
import { IngredientCategoryMother } from '../../__mothers__/IngredientCategoryMother'

describe('FindIngredientCategoryHandler', () => {
  let handler: FindIngredientCategoryHandler
  let useCase: jest.Mocked<FindIngredientCategory>

  beforeEach(() => {
    useCase = {
      execute: jest.fn()
    } as any

    handler = new FindIngredientCategoryHandler(useCase)
  })

  it('should return mapped response DTO', async () => {
    const category = IngredientCategoryMother.create({
      id: '123',
      name: 'Carnes'
    })
    useCase.execute.mockResolvedValue(category)

    const result = await handler.execute(new FindIngredientCategoryQuery('123'))

    expect(result).toBeInstanceOf(Object) // DTO es plain object
    expect(result.id).toBe('123')
    expect(result.name).toBe('Carnes')
    expect(result).not.toHaveProperty('pullDomainEvents') // No es agregado
  })

  it('should call use case with correct id', async () => {
    const category = IngredientCategoryMother.create()
    useCase.execute.mockResolvedValue(category)

    await handler.execute(new FindIngredientCategoryQuery('123'))

    expect(useCase.execute).toHaveBeenCalledWith('123')
  })
})
```

---

## 🎓 Conclusión

El **Mapper Pattern en Application Layer** es la solución correcta para:

✅ Mantener Use Cases puros y reutilizables
✅ Respetar la Dependency Rule de Onion Architecture
✅ Separar responsabilidades claramente
✅ Facilitar testing aislado
✅ Escalar a múltiples formatos de salida

**Esta propuesta está lista para ser implementada en el proyecto de manera incremental, comenzando por el módulo `units` como piloto.**

---

**Autor:** Equipo de Desarrollo
**Revisión:** Pendiente
**Aprobación:** Pendiente
**Estado:** 📋 Propuesta
