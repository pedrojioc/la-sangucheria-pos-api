# Diseño Alternativo: Creación de Ingredientes Preparados

**Fecha:** 2025-12-10
**Estado:** Propuesta/Alternativa
**Contexto:** Mejorar el flujo de creación de ingredientes preparados (con receta de transformación)

---

## Problema Actual

### Flujo del Usuario (Real)
```
1. Usuario: "Quiero crear un ingrediente"
2. Sistema: "¿Es preparado?"
   - Si NO → Crear ingrediente simple (Inventory context)
   - Si SÍ → Crear ingrediente + receta de preparación (Inventory + Kitchen contexts)
```

### Problema Arquitectónico
- **2 endpoints separados:** Uno en Inventory (`/ingredients`) y otro en Kitchen (`/preparation-recipes/bulk`)
- **Responsabilidad desplazada:** El endpoint de Kitchen crea ingredientes (responsabilidad de Inventory)
- **No refleja el flujo del usuario:** El frontend debe decidir a qué endpoint llamar
- **Complejidad innecesaria:** El usuario solo quiere "crear un ingrediente" (preparado o no)

### Implementación Actual
```typescript
// Kitchen Context - preparation-recipe.controller.ts
@Post('bulk')
async createWithIngredients(@Body() dto: CreatePreparationRecipeBulkRequest): Promise<void> {
  await this.creatorService.createWithIngredients({
    recipeId: dto.recipeId,
    recipeName: dto.recipeName,
    baseIngredientId: dto.baseIngredientId,
    outputIngredientId: dto.outputIngredientId,
    outputIngredientData: { ... },  // ← Kitchen creando ingredientes!
    yieldPercentage: dto.yieldPercentage,
    additionalIngredients: dto.additionalIngredients
  })
}
```

**Problema:** Kitchen context asume responsabilidad de Inventory (crear ingredientes).

---

## Solución Propuesta: Application Service en Inventory

Basándonos en DDD y el principio de "seguir el flujo del usuario", la solución correcta es:

### Principios de Diseño

1. **Inventory context controla la creación de ingredientes** (bounded context owner)
2. **Kitchen context solo maneja recetas de transformación** (responsabilidad única)
3. **Un solo punto de entrada** que refleja el flujo del usuario
4. **Orquestación en Application Layer** (no en controlador)

---

## Arquitectura Propuesta

### 1. Estructura de Archivos

```
src/contexts/inventory/ingredient/
├── application/
│   ├── create/
│   │   ├── create-ingredient.ts                    # Caso simple
│   │   ├── create-ingredient.command.ts
│   │   └── create-ingredient.handler.ts
│   │
│   ├── create-prepared/                             # ← NUEVO
│   │   ├── create-prepared-ingredient.ts            # Orquestador
│   │   ├── create-prepared-ingredient.command.ts
│   │   └── create-prepared-ingredient.handler.ts
│   │
│   └── services/                                    # ← NUEVO
│       └── transformation-client.ts                 # Interfaz Kitchen context
│
├── infrastructure/
│   └── services/                                    # ← NUEVO
│       └── kitchen-transformation-client.ts         # Implementación
│
└── presentation/
    └── http/
        ├── controllers/
        │   └── ingredient.controller.ts             # Punto de entrada único
        └── dto/
            └── create-ingredient.request.ts         # DTO con campos opcionales
```

### 2. Controller con Lógica Condicional

```typescript
// src/contexts/inventory/ingredient/presentation/http/controllers/ingredient.controller.ts

@Controller('ingredients')
export class IngredientController {
  constructor(
    private readonly commandBus: CommandBus
  ) {}

  /**
   * Crear ingrediente (simple o preparado)
   *
   * @example Ingrediente simple
   * POST /ingredients
   * {
   *   "id": "uuid",
   *   "name": "Tomate",
   *   "categoryId": "vegetales-uuid",
   *   "unitId": "kg-uuid",
   *   "isPrepared": false
   * }
   *
   * @example Ingrediente preparado
   * POST /ingredients
   * {
   *   "id": "uuid",
   *   "name": "Pollo Cocido Desmenuzado",
   *   "categoryId": "carnes-uuid",
   *   "unitId": "kg-uuid",
   *   "isPrepared": true,
   *   "preparationRecipe": {
   *     "recipeId": "recipe-uuid",
   *     "recipeName": "Cocinar y Desmenuzar Pollo",
   *     "baseIngredientId": "pollo-crudo-uuid",
   *     "yieldPercentage": 85,
   *     "additionalIngredients": [...]
   *   }
   * }
   */
  @Post()
  async create(@Body() dto: CreateIngredientRequest): Promise<void> {
    // Determinar qué comando ejecutar basado en los datos
    if (dto.isPrepared && dto.preparationRecipe) {
      // Crear ingrediente preparado (con receta)
      const command = new CreatePreparedIngredientCommand(
        dto.id,
        dto.name,
        dto.categoryId,
        dto.unitId,
        dto.description,
        dto.preferredSupplierId,
        dto.minimumStock,
        dto.maximumStock,
        dto.isPerishable,
        dto.shelfLifeDays,
        dto.storageLocation,
        dto.isActive,
        dto.preparationRecipe  // ← Datos de la receta
      )
      await this.commandBus.execute(command)
    } else {
      // Crear ingrediente simple
      const command = new CreateIngredientCommand(
        dto.id,
        dto.name,
        dto.categoryId,
        dto.unitId,
        dto.description,
        dto.preferredSupplierId,
        dto.minimumStock,
        dto.maximumStock,
        dto.isPerishable,
        dto.shelfLifeDays,
        dto.storageLocation,
        dto.isActive
      )
      await this.commandBus.execute(command)
    }
  }
}
```

### 3. DTO con Campos Opcionales

```typescript
// src/contexts/inventory/ingredient/presentation/http/dto/create-ingredient.request.ts

import { Type } from 'class-transformer'
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested
} from 'class-validator'

export class AdditionalIngredientData {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  @Min(0)
  quantityPerUnit: number

  @IsUUID()
  @IsNotEmpty()
  unitId: string
}

export class PreparationRecipeData {
  @IsUUID()
  @IsNotEmpty()
  recipeId: string

  @IsString()
  @IsNotEmpty()
  recipeName: string

  @IsOptional()
  @IsString()
  recipeDescription?: string

  @IsUUID()
  @IsNotEmpty()
  baseIngredientId: string

  @IsNumber()
  @Min(0)
  @Max(100)
  yieldPercentage: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalIngredientData)
  additionalIngredients?: AdditionalIngredientData[]
}

export class CreateIngredientRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsUUID()
  @IsNotEmpty()
  categoryId: string

  @IsUUID()
  @IsNotEmpty()
  unitId: string

  @IsOptional()
  @IsUUID()
  preferredSupplierId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumStock?: number

  @IsOptional()
  @IsBoolean()
  isPerishable?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1)
  shelfLifeDays?: number

  @IsOptional()
  @IsString()
  storageLocation?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  // Campos de preparación (opcionales)
  @IsOptional()
  @IsBoolean()
  isPrepared?: boolean

  @IsOptional()
  @ValidateNested()
  @Type(() => PreparationRecipeData)
  preparationRecipe?: PreparationRecipeData
}
```

### 4. Application Service Orquestador

```typescript
// src/contexts/inventory/ingredient/application/create-prepared/create-prepared-ingredient.ts

export class CreatePreparedIngredient {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly transformationClient: TransformationClient,  // ← Cliente Kitchen context
    private readonly eventBus: EventBus
  ) {}

  async run(
    // Datos del ingrediente
    id: string,
    name: string,
    description: string | null,
    categoryId: string,
    unitId: string,
    preferredSupplierId: string | null,
    minimumStock: number | null,
    maximumStock: number | null,
    isPerishable: boolean,
    shelfLifeDays: number | null,
    storageLocation: string | null,
    isActive: boolean,

    // Datos de la receta
    recipeData: {
      recipeId: string
      recipeName: string
      recipeDescription: string | null
      baseIngredientId: string
      yieldPercentage: number
      additionalIngredients: Array<{
        ingredientId: string
        quantityPerUnit: number
        unitId: string
      }>
    }
  ): Promise<void> {
    // 1. Crear el ingrediente de salida (ej. pollo cocido)
    const ingredient = Ingredient.create(
      id,
      name,
      description,
      categoryId,
      unitId,
      preferredSupplierId,
      minimumStock,
      maximumStock,
      isPerishable,
      shelfLifeDays,
      storageLocation,
      isActive
    )
    await this.ingredientRepository.save(ingredient)

    // 2. Crear la receta de preparación en Kitchen context
    await this.transformationClient.createPreparationRecipe({
      recipeId: recipeData.recipeId,
      recipeName: recipeData.recipeName,
      recipeDescription: recipeData.recipeDescription,
      baseIngredientId: recipeData.baseIngredientId,
      outputIngredientId: id,  // ← El ingrediente recién creado
      yieldPercentage: recipeData.yieldPercentage,
      additionalIngredients: recipeData.additionalIngredients
    })

    // 3. Publicar eventos
    const events = ingredient.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
```

### 5. Cliente para Kitchen Context (Interfaz)

```typescript
// src/contexts/inventory/ingredient/application/services/transformation-client.ts

/**
 * Cliente para interactuar con el contexto Kitchen
 * (Interface en Application Layer - domain abstraction)
 */
export abstract class TransformationClient {
  abstract createPreparationRecipe(data: {
    recipeId: string
    recipeName: string
    recipeDescription: string | null
    baseIngredientId: string
    outputIngredientId: string
    yieldPercentage: number
    additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }>
  }): Promise<void>
}
```

### 6. Implementación del Cliente (Infrastructure)

```typescript
// src/contexts/inventory/ingredient/infrastructure/services/kitchen-transformation-client.ts

import { Injectable } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { TransformationClient } from '../../application/services/transformation-client'
import { CreatePreparationRecipeCommand } from '@contexts/kitchen/transformation/application/create/create-preparation-recipe.command'

@Injectable()
export class KitchenTransformationClient implements TransformationClient {
  constructor(private readonly commandBus: CommandBus) {}

  async createPreparationRecipe(data: {
    recipeId: string
    recipeName: string
    recipeDescription: string | null
    baseIngredientId: string
    outputIngredientId: string
    yieldPercentage: number
    additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }>
  }): Promise<void> {
    const command = new CreatePreparationRecipeCommand(
      data.recipeId,
      data.recipeName,
      data.baseIngredientId,
      data.outputIngredientId,
      data.yieldPercentage,
      data.additionalIngredients,
      data.recipeDescription
    )

    await this.commandBus.execute(command)
  }
}
```

### 7. Command y Handler

```typescript
// src/contexts/inventory/ingredient/application/create-prepared/create-prepared-ingredient.command.ts

export class CreatePreparedIngredientCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly categoryId: string,
    public readonly unitId: string,
    public readonly description: string | null,
    public readonly preferredSupplierId: string | null,
    public readonly minimumStock: number | null,
    public readonly maximumStock: number | null,
    public readonly isPerishable: boolean,
    public readonly shelfLifeDays: number | null,
    public readonly storageLocation: string | null,
    public readonly isActive: boolean,
    public readonly preparationRecipe: {
      recipeId: string
      recipeName: string
      recipeDescription: string | null
      baseIngredientId: string
      yieldPercentage: number
      additionalIngredients: Array<{
        ingredientId: string
        quantityPerUnit: number
        unitId: string
      }>
    }
  ) {}
}
```

```typescript
// src/contexts/inventory/ingredient/application/create-prepared/create-prepared-ingredient.handler.ts

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreatePreparedIngredientCommand } from './create-prepared-ingredient.command'
import { CreatePreparedIngredient } from './create-prepared-ingredient'

@CommandHandler(CreatePreparedIngredientCommand)
export class CreatePreparedIngredientHandler implements ICommandHandler<CreatePreparedIngredientCommand> {
  constructor(private readonly useCase: CreatePreparedIngredient) {}

  async execute(command: CreatePreparedIngredientCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.description,
      command.categoryId,
      command.unitId,
      command.preferredSupplierId,
      command.minimumStock,
      command.maximumStock,
      command.isPerishable,
      command.shelfLifeDays,
      command.storageLocation,
      command.isActive,
      command.preparationRecipe
    )
  }
}
```

### 8. Registro en Module

```typescript
// src/contexts/inventory/ingredient/ingredient.module.ts

import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransformationModule } from '@contexts/kitchen/transformation/transformation.module'

// Use Cases
import { CreateIngredient } from './application/create/create-ingredient'
import { CreatePreparedIngredient } from './application/create-prepared/create-prepared-ingredient'

// Handlers
import { CreateIngredientHandler } from './application/create/create-ingredient.handler'
import { CreatePreparedIngredientHandler } from './application/create-prepared/create-prepared-ingredient.handler'

// Clients
import { TransformationClient } from './application/services/transformation-client'
import { KitchenTransformationClient } from './infrastructure/services/kitchen-transformation-client'

// Infrastructure
import { IngredientRepository } from './domain/repositories/ingredient.repository'
import { TypeOrmIngredientRepository } from './infrastructure/persistence/typeorm/typeorm-ingredient.repository'
import { IngredientEntity } from './infrastructure/persistence/typeorm/ingredient.entity'

// Presentation
import { IngredientController } from './presentation/http/controllers/ingredient.controller'

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([IngredientEntity]),
    TransformationModule  // ← Importar Kitchen module
  ],
  controllers: [IngredientController],
  providers: [
    // Repositories
    {
      provide: IngredientRepository,
      useClass: TypeOrmIngredientRepository
    },

    // Clients
    {
      provide: TransformationClient,
      useClass: KitchenTransformationClient
    },

    // Use Cases
    CreateIngredient,
    CreatePreparedIngredient,

    // Handlers
    CreateIngredientHandler,
    CreatePreparedIngredientHandler
  ],
  exports: [IngredientRepository]
})
export class IngredientModule {}
```

---

## Ventajas de Esta Solución

### ✅ Experiencia de Usuario
- **Un solo endpoint:** `POST /ingredients` (simple o preparado)
- **Flujo natural:** El usuario solo piensa en "crear ingrediente"
- **Menos complejidad en frontend:** No decidir entre 2 endpoints diferentes

### ✅ Arquitectura DDD
- **Bounded Context correcto:** Inventory controla ingredientes, Kitchen controla recetas
- **Responsabilidad única:** Cada contexto hace solo su trabajo
- **Separación clara:** Cliente (TransformationClient) desacopla contextos

### ✅ Mantenibilidad
- **Orquestación explícita:** El flujo completo está en un solo lugar
- **Fácil de testear:** Mockear TransformationClient en tests
- **Transaccionalidad controlada:** Se puede envolver en transacción si es necesario

### ✅ Escalabilidad
- **Fácil agregar validaciones:** Verificar que baseIngredient existe, etc.
- **Fácil agregar eventos:** IngredientPreparedCreated, etc.
- **Fácil revertir:** Si falla Kitchen, revertir Ingredient (saga pattern)

---

## Ejemplo de Uso (Frontend)

### Request Ingrediente Simple

```json
POST /ingredients
{
  "id": "uuid-1",
  "name": "Tomate",
  "description": "Tomate fresco",
  "categoryId": "vegetales-uuid",
  "unitId": "kg-uuid",
  "isPerishable": true,
  "shelfLifeDays": 7,
  "isActive": true,
  "isPrepared": false
}
```

### Request Ingrediente Preparado

```json
POST /ingredients
{
  "id": "uuid-2",
  "name": "Pollo Cocido Desmenuzado",
  "description": "Pechuga de pollo cocida y desmenuzada",
  "categoryId": "carnes-uuid",
  "unitId": "kg-uuid",
  "isPerishable": true,
  "shelfLifeDays": 2,
  "isActive": true,
  "isPrepared": true,
  "preparationRecipe": {
    "recipeId": "recipe-uuid",
    "recipeName": "Cocinar y Desmenuzar Pollo",
    "recipeDescription": "Cocinar pechuga de pollo y desmenuzar",
    "baseIngredientId": "pollo-crudo-uuid",
    "yieldPercentage": 85,
    "additionalIngredients": [
      {
        "ingredientId": "sal-uuid",
        "quantityPerUnit": 5,
        "unitId": "g-uuid"
      },
      {
        "ingredientId": "pimienta-uuid",
        "quantityPerUnit": 2,
        "unitId": "g-uuid"
      }
    ]
  }
}
```

---

## Comparación con Implementación Actual

| Aspecto | Implementación Actual | Propuesta |
|---------|----------------------|-----------|
| **Endpoints** | 2 endpoints separados | 1 endpoint unificado |
| **Responsabilidad** | Kitchen crea ingredientes | Inventory crea ingredientes |
| **Orquestación** | En Kitchen context | En Inventory context |
| **Experiencia Usuario** | Elegir endpoint correcto | Siempre mismo endpoint |
| **Complejidad Frontend** | Alta (2 flujos) | Baja (1 flujo) |
| **DDD Compliance** | ⚠️ Violación de bounded context | ✅ Respeta bounded contexts |

---

## Migración (Si se implementa)

### Paso 1: Crear nuevos componentes
- [ ] `TransformationClient` (interfaz)
- [ ] `KitchenTransformationClient` (implementación)
- [ ] `CreatePreparedIngredient` (use case)
- [ ] `CreatePreparedIngredientCommand` y Handler
- [ ] Actualizar `CreateIngredientRequest` DTO

### Paso 2: Actualizar Controller
- [ ] Agregar lógica condicional en `IngredientController.create()`

### Paso 3: Registrar en Module
- [ ] Importar `TransformationModule`
- [ ] Registrar `TransformationClient`
- [ ] Registrar use case y handler

### Paso 4: Testing
- [ ] Tests unitarios del use case
- [ ] Tests de integración del controller
- [ ] Tests E2E del flujo completo

### Paso 5: Deprecar endpoint antiguo
- [ ] Marcar `POST /preparation-recipes/bulk` como deprecated
- [ ] Migrar frontend al nuevo endpoint
- [ ] Eliminar endpoint antiguo

---

## Notas Adicionales

### Transaccionalidad

Si necesitas garantizar atomicidad (ingrediente + receta), puedes:

```typescript
// Opción 1: Unit of Work pattern
await this.unitOfWork.execute(async (tx) => {
  await this.ingredientRepository.save(ingredient, tx)
  await this.transformationClient.createPreparationRecipe(recipeData, tx)
})

// Opción 2: Saga pattern (si falla Kitchen, revertir Ingredient)
try {
  await this.ingredientRepository.save(ingredient)
  await this.transformationClient.createPreparationRecipe(recipeData)
} catch (error) {
  await this.ingredientRepository.delete(ingredient.id)
  throw error
}
```

### Validaciones Adicionales

```typescript
// En el use case, antes de crear:
// 1. Verificar que baseIngredient existe
const baseIngredient = await this.ingredientRepository.findById(recipeData.baseIngredientId)
if (!baseIngredient) {
  throw new IngredientNotFound(recipeData.baseIngredientId)
}

// 2. Verificar que additionalIngredients existen
for (const additional of recipeData.additionalIngredients) {
  const ingredient = await this.ingredientRepository.findById(additional.ingredientId)
  if (!ingredient) {
    throw new IngredientNotFound(additional.ingredientId)
  }
}
```

---

## Referencias

- **CLAUDE.md:** Sección "Onion Architecture" y "CQRS"
- **DDD:** Eric Evans - "Domain-Driven Design" (Bounded Contexts)
- **Clean Architecture:** Robert C. Martin (Dependency Rule)
- **CodelyTV:** Application Services para orquestación entre contextos

---

**Conclusión:** Esta propuesta alinea la arquitectura con el flujo real del usuario, respeta los principios de DDD (bounded contexts), y simplifica tanto el frontend como el backend. Es la solución más natural y mantenible a largo plazo.
