El Problema
// Domain Model (Write Side)
class Ingredient {
categoryId: IngredientCategoryId // ← Solo ID
unitId: UnitId // ← Solo ID
}

// UI Needs (Read Side)
[
{ id: '1', name: 'Pollo', categoryName: 'Carnes', unitName: 'kg' },
{ id: '2', name: 'Lechuga', categoryName: 'Vegetales', unitName: 'unidad' }
]
Solución DDD: Queries Separadas (Read Models)
Opción 1: Query Handler con Joins (Recomendada para tu caso)
Patrón: Consulta directa a DB con JOINs en la capa de infraestructura
// 1. Request DTO
export class FindAllIngredientsRequest {
// Query params para filtros si los necesitas
}

// 2. Response DTO con datos desnormalizados
export class IngredientListItemResponse {
id: string
name: string
description: string | null

// ← Datos de otras agregados (desnormalizados)
categoryId: string
categoryName: string
categoryColor: string | null

unitId: string
unitName: string
unitSymbol: string

minimumStock: number | null
currentStock: number | null
isActive: boolean

static fromQueryResult(row: any): IngredientListItemResponse {
return {
id: row.ingredient_id,
name: row.ingredient_name,
description: row.ingredient_description,
categoryId: row.category_id,
categoryName: row.category_name,
categoryColor: row.category_color,
unitId: row.unit_id,
unitName: row.unit_name,
unitSymbol: row.unit_symbol,
minimumStock: row.minimum_stock,
currentStock: row.current_stock,
isActive: row.is_active
}
}
}
// 3. Query (POJO)
export class FindAllIngredientsQuery {
constructor(
public readonly filters?: {
categoryId?: string
isActive?: boolean
// ... otros filtros
}
) {}
}
// 4. Query Handler con JOIN directo
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler implements IQueryHandler {
constructor(
@InjectRepository(IngredientEntity)
private readonly ingredientRepo: Repository<IngredientEntity>
) {}

async execute(
query: FindAllIngredientsQuery
): Promise<IngredientListItemResponse[]> {

    // ✅ JOIN directo en la query (Read Model)
    const queryBuilder = this.ingredientRepo
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.category', 'category')
      .leftJoinAndSelect('ingredient.unit', 'unit')
      .select([
        'ingredient.id as ingredient_id',
        'ingredient.name as ingredient_name',
        'ingredient.description as ingredient_description',
        'ingredient.minimumStock as minimum_stock',
        'ingredient.isActive as is_active',
        'category.id as category_id',
        'category.name as category_name',
        'category.color as category_color',
        'unit.id as unit_id',
        'unit.name as unit_name',
        'unit.symbol as unit_symbol'
      ])

    // Aplicar filtros si existen
    if (query.filters?.categoryId) {
      queryBuilder.where('category.id = :categoryId', {
        categoryId: query.filters.categoryId
      })
    }

    if (query.filters?.isActive !== undefined) {
      queryBuilder.andWhere('ingredient.isActive = :isActive', {
        isActive: query.filters.isActive
      })
    }

    const results = await queryBuilder.getRawMany()

    return results.map(row => IngredientListItemResponse.fromQueryResult(row))

}
}
Pero necesitas configurar las relaciones en TypeORM Entity:
// infrastructure/persistence/typeorm/ingredient.entity.ts
@Entity('ingredients')
export class IngredientEntity {
@PrimaryColumn('uuid')
id: string

@Column({ type: 'varchar', length: 100 })
name: string

@Column({ type: 'text', nullable: true })
description: string | null

// ✅ Relaciones para JOINs (solo para queries)
@ManyToOne(() => IngredientCategoryEntity, { eager: false })
@JoinColumn({ name: 'ingredient_category_id' })
category: IngredientCategoryEntity

@ManyToOne(() => UnitEntity, { eager: false })
@JoinColumn({ name: 'unit_id' })
unit: UnitEntity

@Column({ name: 'ingredient_category_id', type: 'uuid' })
ingredientCategoryId: string

@Column({ name: 'unit_id', type: 'uuid' })
unitId: string

// ... otros campos
}
// 5. Controller
@Controller('ingredients')
export class IngredientController {
constructor(private readonly queryBus: QueryBus) {}

@Get()
async findAll(
@Query() filters: FindAllIngredientsRequest
): Promise<IngredientListItemResponse[]> {
const query = new FindAllIngredientsQuery(filters)
return this.queryBus.execute(query)
}
}
Opción 2: N+1 Queries con Repository (Menos eficiente)
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(
private readonly ingredientRepo: IngredientRepository,
private readonly categoryRepo: IngredientCategoryRepository,
private readonly unitRepo: UnitRepository
) {}

async execute(query: FindAllIngredientsQuery) {
const ingredients = await this.ingredientRepo.searchAll()

    // ❌ N+1 queries problem
    const responses = await Promise.all(
      ingredients.map(async (ingredient) => {
        const category = await this.categoryRepo.search(ingredient.categoryId)
        const unit = await this.unitRepo.search(ingredient.unitId)

        return {
          id: ingredient.id.value,
          name: ingredient.name.value,
          categoryName: category?.name.value ?? 'Unknown',
          unitName: unit?.name.value ?? 'Unknown'
        }
      })
    )

    return responses

}
}
❌ Problema: Si tienes 100 ingredientes = 1 query + 100 queries (categorías) + 100 queries (unidades) = 201 queries
Opción 3: Batch Loading (Optimización de N+1)
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(
private readonly ingredientRepo: IngredientRepository,
private readonly categoryRepo: IngredientCategoryRepository,
private readonly unitRepo: UnitRepository
) {}

async execute(query: FindAllIngredientsQuery) {
const ingredients = await this.ingredientRepo.searchAll()

    // ✅ Batch queries
    const categoryIds = [...new Set(ingredients.map(i => i.categoryId))]
    const unitIds = [...new Set(ingredients.map(i => i.unitId))]

    const [categories, units] = await Promise.all([
      this.categoryRepo.searchByIds(categoryIds),  // 1 query con WHERE IN
      this.unitRepo.searchByIds(unitIds)           // 1 query con WHERE IN
    ])

    // Crear mapas para lookup O(1)
    const categoryMap = new Map(categories.map(c => [c.id.value, c]))
    const unitMap = new Map(units.map(u => [u.id.value, u]))

    return ingredients.map(ingredient => ({
      id: ingredient.id.value,
      name: ingredient.name.value,
      categoryName: categoryMap.get(ingredient.categoryId.value)?.name.value ?? 'Unknown',
      unitName: unitMap.get(ingredient.unitId.value)?.name.value ?? 'Unknown'
    }))

}
}
Pero necesitas agregar searchByIds en los repositorios:
// domain/repositories/ingredient-category.repository.ts
export abstract class IngredientCategoryRepository {
abstract search(id: IngredientCategoryId): Promise<IngredientCategory | null>
abstract searchAll(): Promise<IngredientCategory[]>
abstract searchByIds(ids: IngredientCategoryId[]): Promise<IngredientCategory[]> // ← Nuevo
}

// infrastructure/typeorm-ingredient-category.repository.ts
async searchByIds(ids: IngredientCategoryId[]): Promise<IngredientCategory[]> {
const idValues = ids.map(id => id.value)
const entities = await this.repository.findBy({
id: In(idValues) // ← WHERE id IN (...)
})
return entities.map(e => IngredientCategory.fromPrimitives(e))
}
Recomendación para Tu Proyecto
Usa Opción 1 (Query Handler con JOINs) porque: ✅ Performance: 1 query vs muchas ✅ Simple: TypeORM hace el JOIN automáticamente ✅ CQRS puro: Separación clara entre Commands (write) y Queries (read) ✅ Escalable: Fácil agregar filtros, ordenamiento, paginación
Estructura de Archivos
src/contexts/inventory/ingredient/
├── domain/
│ ├── ingredient.ts # Agregado (solo IDs)
│ └── repositories/
│ └── ingredient.repository.ts # Métodos para Commands
│
├── application/
│ ├── create/ # Command
│ │ ├── create-ingredient.ts
│ │ ├── create-ingredient.command.ts
│ │ └── create-ingredient.handler.ts
│ │
│ └── find-all/ # Query ← NUEVO
│ ├── find-all-ingredients.query.ts
│ └── find-all-ingredients.handler.ts
│
├── infrastructure/
│ └── persistence/
│ └── typeorm/
│ ├── ingredient.entity.ts # Con @ManyToOne para JOINs
│ └── typeorm-ingredient.repository.ts
│
└── presentation/
└── http/
├── controllers/
│ └── ingredient.controller.ts
└── dto/
├── find-all-ingredients.request.ts
└── ingredient-list-item.response.ts # ← Desnormalizado
Implementación Completa
Read ingredient.entity.ts
Perfecto, veo que ya tienes las relaciones configuradas en la entity (líneas 31-33 y 38-40). Solo hay un pequeño error de tipado en la línea 40. Déjame mostrarte la implementación completa:

1. Corregir el tipo de la relación unit
   Edit ingredient.entity.ts
   ⎿
   Modified
   Ahora voy a crear la implementación completa del Query Handler con JOINs:
2. Response DTO (Desnormalizado para UI)
   Write ingredient-list-item.response.ts
   ⎿
   44 lines
   export class IngredientListItemResponse {
   id: string
   name: string
   description: string | null

// Datos de categoría (desnormalizados)
categoryId: string
categoryName: string
categoryColor: string | null

// Datos de unidad (desnormalizados)
unitId: string
unitName: string
unitSymbol: string

// Datos del ingrediente
minimumStock: number | null
maximumStock: number | null
isPerishable: boolean
shelfLifeDays: number | null
storageLocation: string | null
isActive: boolean

static fromQueryResult(row: any): IngredientListItemResponse {
return {
id: row.ingredient_id,
name: row.ingredient_name,
description: row.ingredient_description,
categoryId: row.category_id,
categoryName: row.category_name,
categoryColor: row.category_color,
unitId: row.unit_id,
unitName: row.unit_name,
unitSymbol: row.unit_symbol,
minimumStock: row.minimum_stock ? parseFloat(row.minimum_stock) : null,
maximumStock: row.maximum_stock ? parseFloat(row.maximum_stock) : null,
isPerishable: row.is_perishable,
shelfLifeDays: row.shelf_life_days,
storageLocation: row.storage_location,
isActive: row.is_active
}
}
} 3. Query (POJO)
Write find-all-ingredients.query.ts
⎿
10 lines
export class FindAllIngredientsQuery {
constructor(
public readonly filters?: {
categoryId?: string
isActive?: boolean
search?: string
}
) {}
} 4. Query Handler con JOINs
Write find-all-ingredients.handler.ts
⎿
Write failed
⎿
Reason: Solo dime qué debo hacer, yo mismo lo implemento y ten en cuenta que estamos usando el patrón criteria para filtrar y paginar
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FindAllIngredientsQuery } from './find-all-ingredients.query'
import { IngredientListItemResponse } from '../../presentation/http/dto/ingredient-list-item.response'
import { IngredientEntity } from '../../infrastructure/persistence/typeorm/ingredient.entity'

@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler implements IQueryHandler<FindAllIngredientsQuery> {
constructor(
@InjectRepository(IngredientEntity)
private readonly ingredientRepo: Repository<IngredientEntity>
) {}

async execute(query: FindAllIngredientsQuery): Promise<IngredientListItemResponse[]> {
const queryBuilder = this.ingredientRepo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
.leftJoin('ingredient.unit', 'unit')
.select([
'ingredient.id AS ingredient_id',
'ingredient.name AS ingredient_name',
'ingredient.description AS ingredient_description',
'ingredient.minimumStock AS minimum_stock',
'ingredient.maximumStock AS maximum_stock',
'ingredient.isPerishable AS is_perishable',
'ingredient.shelfLifeDays AS shelf_life_days',
'ingredient.storageLocation AS storage_location',
'ingredient.isActive AS is_active',
'category.id AS category_id',
'category.name AS category_name',
'category.color AS category_color',
'unit.id AS unit_id',
'unit.name AS unit_name',
'unit.symbol AS unit_symbol'
])

    // Aplicar filtros opcionales
    if (query.filters?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: query.filters.categoryId
      })
    }

    if (query.filters?.isActive !== undefined) {
      queryBuilder.andWhere('ingredient.isActive = :isActive', {
        isActive: query.filters.isActive
      })
    }

    if (query.filters?.search) {
      queryBuilder.andWhere('ingredient.name ILIKE :search', {
        search: `%${query.filters.search}%`
      })
    }

    // Ordenar por nombre
    queryBuilder.orderBy('ingredient.name', 'ASC')

    const results = await queryBuilder.getRawMany()

    return results.map(row => IngredientListItemResponse.fromQueryResult(row))

}
}
Perfecto, entiendo. Te daré las instrucciones para que lo implementes tú mismo, considerando el patrón Criteria.
Guía de Implementación con Criteria Pattern
Contexto Importante
Según tu CLAUDE.md, el patrón Criteria debe usarse solo para módulos con > 100 registros esperados. Pregunta clave: ¿Esperas tener más de 100 ingredientes?
✅ SI: Usa Criteria (con pagination, filters, sorting)
❌ NO: Usa findAll() simple con JOIN
Opción A: Con Criteria Pattern (> 100 ingredientes esperados)

1.  Modificar TypeOrmCriteriaConverter para soportar JOINs
    Archivo: src/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter.ts Agrega método para configurar JOINs opcionales:
    export class TypeOrmCriteriaConverter {
    static convert<T>(
    queryBuilder: SelectQueryBuilder<T>,
    criteria: Criteria,
    joins?: { relation: string; alias: string }[] // ← Nuevo parámetro
    ): SelectQueryBuilder<T> {

        // Agregar JOINs si se especifican
        if (joins) {
          joins.forEach(join => {
            queryBuilder.leftJoin(join.relation, join.alias)
          })
        }

        // ... resto del código existente (filters, order, pagination)

    }
    }

2.  Modificar el Repository para agregar JOINs en matching()
    Archivo: src/contexts/inventory/ingredient/infrastructure/persistence/typeorm/typeorm-ingredient.repository.ts
    async matching(criteria: Criteria): Promise<PaginatedResult<Ingredient>> {
    const queryBuilder = this.repository.createQueryBuilder('ingredient')

// ✅ Configurar JOINs para poder filtrar/ordenar por campos relacionados
const joins = [
{ relation: 'ingredient.category', alias: 'category' },
{ relation: 'ingredient.unit', alias: 'unit' }
]

TypeOrmCriteriaConverter.convert(queryBuilder, criteria, joins)

const [entities, total] = await queryBuilder.getManyAndCount()

const ingredients = entities.map(e => Ingredient.fromPrimitives({
id: e.id,
name: e.name,
// ... mapeo normal
}))

return new PaginatedResult(
ingredients,
total,
criteria.pagination?.page ?? 1,
criteria.pagination?.pageSize ?? 20
)
} 3. Crear Query Handler que use Criteria + Enriquece con datos relacionados
Archivo: src/contexts/inventory/ingredient/application/search-by-criteria/search-ingredients-by-criteria.handler.ts
@QueryHandler(SearchIngredientsByCriteriaQuery)
export class SearchIngredientsByCriteriaHandler {
constructor(
private readonly ingredientRepo: IngredientRepository,
private readonly categoryRepo: IngredientCategoryRepository,
private readonly unitRepo: UnitRepository
) {}

async execute(query: SearchIngredientsByCriteriaQuery) {
// 1. Obtener ingredientes con criteria (paginados)
const result = await this.ingredientRepo.matching(query.criteria)

    // 2. Obtener IDs únicos de categorías y unidades
    const categoryIds = [...new Set(result.data.map(i => i.categoryId))]
    const unitIds = [...new Set(result.data.map(i => i.unitId))]

    // 3. Batch queries (2 queries adicionales, no N+1)
    const [categories, units] = await Promise.all([
      this.categoryRepo.searchByIds(categoryIds),
      this.unitRepo.searchByIds(unitIds)
    ])

    // 4. Crear mapas para lookup O(1)
    const categoryMap = new Map(categories.map(c => [c.id.value, c]))
    const unitMap = new Map(units.map(u => [u.id.value, u]))

    // 5. Transformar a DTOs con datos relacionados
    const enrichedData = result.data.map(ingredient => ({
      id: ingredient.id.value,
      name: ingredient.name.value,
      description: ingredient.description?.value ?? null,
      categoryId: ingredient.categoryId.value,
      categoryName: categoryMap.get(ingredient.categoryId.value)?.name.value ?? 'Unknown',
      categoryColor: categoryMap.get(ingredient.categoryId.value)?.color?.value ?? null,
      unitId: ingredient.unitId.value,
      unitName: unitMap.get(ingredient.unitId.value)?.name.value ?? 'Unknown',
      unitSymbol: unitMap.get(ingredient.unitId.value)?.symbol.value ?? '',
      minimumStock: ingredient.minimumStock?.value ?? null,
      maximumStock: ingredient.maximumStock?.value ?? null,
      isPerishable: ingredient.isPerishable.value,
      shelfLifeDays: ingredient.shelfLifeDays?.value ?? null,
      storageLocation: ingredient.storageLocation?.value ?? null,
      isActive: ingredient.isActive.value
    }))

    return {
      data: enrichedData,
      meta: result.meta
    }

}
} 4. Agregar searchByIds() a los repositorios
Dominio: ingredient-category.repository.ts
abstract searchByIds(ids: IngredientCategoryId[]): Promise<IngredientCategory[]>
Infraestructura: typeorm-ingredient-category.repository.ts
import { In } from 'typeorm'

async searchByIds(ids: IngredientCategoryId[]): Promise<IngredientCategory[]> {
const idValues = ids.map(id => id.value)
const entities = await this.repository.findBy({ id: In(idValues) })
return entities.map(e => IngredientCategory.fromPrimitives(e))
}
Repite lo mismo para UnitRepository.
Opción B: Sin Criteria (< 100 ingredientes esperados)
Si esperas < 100 ingredientes, es más simple:
Query Handler con JOIN directo (sin Criteria)
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async execute(query: FindAllIngredientsQuery) {
const queryBuilder = this.repo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
.leftJoin('ingredient.unit', 'unit')
.select([
'ingredient.id AS ingredient_id',
'ingredient.name AS ingredient_name',
// ... todos los campos
'category.id AS category_id',
'category.name AS category_name',
'category.color AS category_color',
'unit.id AS unit_id',
'unit.name AS unit_name',
'unit.symbol AS unit_symbol'
])
.orderBy('ingredient.name', 'ASC')

    const results = await queryBuilder.getRawMany()

    return results.map(row => IngredientListItemResponse.fromQueryResult(row))

}
}
Resumen de Decisiones
Escenario Patrón Performance Complejidad
< 100 ingredientes findAll() con JOIN 1 query Baja

> 100 ingredientes Criteria + Batch queries 1 + 2 queries Media
> Recomendación:
> Empieza simple (Opción B sin Criteria)
> Migra a Criteria cuando tengas > 100 ingredientes
> ¿Qué opción prefieres implementar? ¿Esperas tener más de 100 ingredientes en el sistema?
> Es correcto inyectar el typeorm repositorio directamente al Query Handler y que el handler sea quien arma la consulta con el repo de infraestructura? Eso es buenas prácticas? qué recomiendan los expertos?
> Excelente pregunta arquitectural. Este es un tema debatido entre expertos DDD/Clean Architecture.
> El Dilema: ¿Dónde va la lógica de Query?
> // Opción A: Handler con TypeORM Repository directamente
> @QueryHandler(FindAllIngredientsQuery)
> export class FindAllIngredientsHandler {
> constructor(

    @InjectRepository(IngredientEntity)  // ← TypeORM directo
    private readonly repo: Repository<IngredientEntity>

) {}

async execute(query: FindAllIngredientsQuery) {
// Handler arma la query SQL
const queryBuilder = this.repo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
// ...
}
}

// Opción B: Handler con Use Case + Domain Repository
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(
private readonly useCase: FindAllIngredients // ← Use Case
) {}

async execute(query: FindAllIngredientsQuery) {
return this.useCase.run(query.filters)
}
}
Opiniones de los Expertos

1. Greg Young (CQRS Creator)
   "Commands go through the Domain. Queries do NOT." "In CQRS, the Query side can bypass the domain model entirely. It's acceptable to query the database directly from the Query Handler for performance and simplicity."
   Postura: ✅ Handler puede usar TypeORM directamente Razón:
   Queries son read-only (no modifican estado)
   No necesitan pasar por agregados ni invariantes
   Performance es crítica (evitar mapping innecesario)
2. Vaughn Vernon (DDD Red Book)
   "Queries should use specialized Read Models, not the domain model." "The repository pattern is primarily for retrieving and persisting Aggregates. For queries, especially complex ones with joins, use a separate query infrastructure."
   Postura: ✅ Handler puede usar TypeORM directamente (para queries) Pero recomienda:
   Separar "Write Repository" (domain) de "Read Repository" (queries)
   Queries van directo a DB con DTOs optimizados
3. Martin Fowler
   "Repository pattern is for Aggregates, not for reporting." "For complex queries with joins and projections, bypass the Repository and use a specialized Query Object or direct SQL."
   Postura: ✅ Handler puede usar TypeORM directamente
4. Uncle Bob (Clean Architecture)
   "The Use Case interactor should depend on abstractions, not frameworks." "Frameworks are details. Your application core should not know about TypeORM, Sequelize, etc."
   Postura: ❌ Handler NO debe usar TypeORM directamente Propone:
   Use Case depende de abstracción (interface)
   Handler llama Use Case
   Use Case llama abstracción implementada en infra
5. Udi Dahan (SOA/DDD Expert)
   "CQRS allows you to optimize reads differently from writes. Don't force reads through the domain model."
   Postura: ✅ Handler puede usar TypeORM directamente
   Consenso de la Industria
   Para Commands (Write Side):
   ✅ TODOS concuerdan:
   Command → Handler → Use Case → Domain Repository → Agregado
   SIEMPRE pasar por dominio (invariantes, eventos, etc.)
   Para Queries (Read Side):
   ⚠️ DEBATE:
   Enfoque Expertos Pros Contras
   Query Handler directo a TypeORM Greg Young, Vaughn Vernon, Fowler, Udi Dahan
   ✅ Performance<br>
   ✅ Simplicidad<br>
   ✅ Menos capas
   ❌ Acoplamiento a framework<br>
   ❌ Dificulta testing
   Query Handler → Use Case → Abstraction Uncle Bob
   ✅ Desacoplamiento<br>
   ✅ Testeable<br>
   ✅ Clean Architecture
   ❌ Más código<br>
   ❌ Over-engineering
   Patrón Pragmático (CodelyTV Style)
   Tu proyecto sigue CodelyTV (pragmatismo sobre pureza). CodelyTV recomienda:
   Para Queries Simples (< 2 tablas):
   // ✅ Use Case + Domain Repository
   @QueryHandler(FindIngredientQuery)
   export class FindIngredientHandler {
   constructor(private readonly useCase: FindIngredient) {}

async execute(query: FindIngredientQuery) {
return this.useCase.run(query.id)
}
}

// Use Case
export class FindIngredient {
constructor(private readonly repo: IngredientRepository) {}

async run(id: string): Promise<Ingredient | null> {
return this.repo.search(new IngredientId(id))
}
}
Para Queries Complejas (JOINs, reportes, listas con joins):
// ✅ Handler directo a TypeORM (Query Object Pattern)
@QueryHandler(FindAllIngredientsWithDetailsQuery)
export class FindAllIngredientsWithDetailsHandler {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async execute(query: FindAllIngredientsWithDetailsQuery) {
const queryBuilder = this.repo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
.leftJoin('ingredient.unit', 'unit')
// ... query compleja

    return queryBuilder.getRawMany()

}
}
Razón:
Queries complejas NO benefician de pasar por dominio
Agregar abstracción = boilerplate sin valor
Performance > Pureza arquitectural (para reads)
Comparación de Alternativas
Alternativa 1: Handler → TypeORM Directamente (Recomendada para tu caso)
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async execute(query: FindAllIngredientsQuery) {
// Query directa con JOINs
}
}
✅ Pros:
Simple, directo
1 query SQL eficiente
Menos archivos
Recomendado por Greg Young, Vaughn Vernon
❌ Contras:
Handler conoce TypeORM (acoplamiento)
Testing requiere DB o mocks complejos
Alternativa 2: Handler → Use Case → Domain Repository
// Handler
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(private readonly useCase: FindAllIngredients) {}

async execute(query: FindAllIngredientsQuery) {
return this.useCase.run()
}
}

// Use Case
export class FindAllIngredients {
constructor(private readonly repo: IngredientRepository) {}

async run(): Promise<Ingredient[]> {
return this.repo.searchAll()
}
}

// Repository (dominio)
abstract class IngredientRepository {
abstract searchAll(): Promise<Ingredient[]> // ← Sin joins
}
❌ Problema:
searchAll() devuelve Ingredient[] (solo IDs de category/unit)
Necesitas N+1 queries para obtener nombres
O forzar al repositorio a hacer JOINs (violando SRP)
Alternativa 3: Query Service (Lectura Especializada)
// Query Service (infraestructura)
@Injectable()
export class IngredientQueryService {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async findAllWithDetails(): Promise<IngredientListItemResponse[]> {
const queryBuilder = this.repo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
.leftJoin('ingredient.unit', 'unit')
// ... JOINs

    const results = await queryBuilder.getRawMany()
    return results.map(row => IngredientListItemResponse.fromQueryResult(row))

}
}

// Handler
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(private readonly queryService: IngredientQueryService) {}

async execute(query: FindAllIngredientsQuery) {
return this.queryService.findAllWithDetails()
}
}
✅ Pros:
Separación clara (Query Service para reads)
Handler no conoce TypeORM directamente
Reutilizable
❌ Contras:
Un archivo más
Query Service sigue en infraestructura (acoplamiento igual)
Alternativa 4: Read Model Repository (CQRS Puro)
// Read Model (DTO)
export class IngredientListItem {
id: string
name: string
categoryName: string
unitName: string
// ... campos desnormalizados
}

// Read Repository (abstracción)
export abstract class IngredientReadRepository {
abstract findAllWithDetails(): Promise<IngredientListItem[]>
}

// Implementación (infraestructura)
@Injectable()
export class TypeOrmIngredientReadRepository implements IngredientReadRepository {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async findAllWithDetails(): Promise<IngredientListItem[]> {
// JOINs y mapeo
}
}

// Use Case
export class FindAllIngredients {
constructor(private readonly readRepo: IngredientReadRepository) {}

async run(): Promise<IngredientListItem[]> {
return this.readRepo.findAllWithDetails()
}
}

// Handler
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(private readonly useCase: FindAllIngredients) {}

async execute(query: FindAllIngredientsQuery) {
return this.useCase.run()
}
}
✅ Pros:
CQRS puro (separación total Read/Write)
Testeable (mock abstracción)
Desacoplado de framework
❌ Contras:
MUCHOS archivos (abstracción, implementación, use case, handler)
Over-engineering para queries simples
Menos pragmático
Recomendación para Tu Proyecto
Basándome en:
Tu arquitectura actual (CodelyTV pragmático)
Complejidad de la query (3 tablas con JOINs)
Consenso de expertos CQRS
✅ Usa Alternativa 3: Query Service
// 1. Query Service (infraestructura)
@Injectable()
export class IngredientQueryService {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async findAllWithDetails(filters?: {
categoryId?: string
isActive?: boolean
}): Promise<IngredientListItemResponse[]> {
const qb = this.repo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
.leftJoin('ingredient.unit', 'unit')
.select([...])

    if (filters?.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: filters.categoryId })
    }

    const results = await qb.getRawMany()
    return results.map(row => IngredientListItemResponse.fromQueryResult(row))

}
}

// 2. Handler (delgado)
@QueryHandler(FindAllIngredientsQuery)
export class FindAllIngredientsHandler {
constructor(private readonly queryService: IngredientQueryService) {}

async execute(query: FindAllIngredientsQuery) {
return this.queryService.findAllWithDetails(query.filters)
}
}
Por qué:
✅ Handler no conoce TypeORM (inyecta servicio)
✅ Query Service encapsula lógica SQL compleja
✅ Reutilizable desde otros handlers
✅ Pragmático (no over-engineering)
✅ Alineado con Greg Young, Vaughn Vernon (queries bypass domain)
Estructura de Archivos
src/contexts/inventory/ingredient/
├── application/
│ └── find-all/
│ ├── find-all-ingredients.query.ts # POJO
│ └── find-all-ingredients.handler.ts # Handler (delgado)
│
├── infrastructure/
│ └── query-services/ # ← NUEVO
│ └── ingredient-query.service.ts # Query Service
│
└── presentation/
└── http/
└── dto/
└── ingredient-list-item.response.ts # DTO
Resumen de Mejores Prácticas
Tipo de Query Patrón Recomendado Pasa por Dominio?
Find by ID (simple) Handler → Use Case → Domain Repo ✅ SÍ
Find all (sin joins) Handler → Use Case → Domain Repo ✅ SÍ
Lists con JOINs Handler → Query Service (infra) ❌ NO
Reportes complejos Handler → Query Service (infra) ❌ NO
Search con Criteria Handler → Use Case → Domain Repo ✅ SÍ (si devuelve agregados)
Search con Criteria + JOINs Handler → Query Service (infra) ❌ NO (devuelve DTOs)
Regla de oro:
Si devuelves Agregados → Pasa por dominio
Si devuelves DTOs proyectados con JOINs → Query Service (infra)
¿Te parece bien usar Query Service? Es el sweet spot entre pureza y pragmatismo.

---

Solución 1: Abstracción para Query Service (Clean Architecture Puro)
Crear una interfaz en Application/Domain y la implementación en Infrastructure.
// 1. Abstracción en Application Layer
// application/query-services/ingredient-query.service.ts
export abstract class IngredientQueryService {
abstract searchWithDetails(
criteria: Criteria
): Promise<PaginatedResult<IngredientListItemResponse>>
}

// 2. Use Case depende de la abstracción
// application/search-with-details/search-ingredients-with-details.ts
export class SearchIngredientsWithDetails {
constructor(
private readonly queryService: IngredientQueryService // ← Abstracción (Application)
) {}

async run(
page: number,
pageSize: number,
filters: Array<{ field: string; operator: string; value: any }>,
orderBy: string | null,
orderType: string | null
): Promise<PaginatedResult<IngredientListItemResponse>> {
const criteria = Criteria.fromPrimitives({
page,
pageSize,
filters,
orderBy,
orderType
})

    return this.queryService.searchWithDetails(criteria)

}
}

// 3. Implementación en Infrastructure
// infrastructure/query-services/typeorm-ingredient-query.service.ts
@Injectable()
export class TypeOrmIngredientQueryService implements IngredientQueryService {
constructor(
@InjectRepository(IngredientEntity)
private readonly repo: Repository<IngredientEntity>
) {}

async searchWithDetails(
criteria: Criteria
): Promise<PaginatedResult<IngredientListItemResponse>> {
const queryBuilder = this.repo
.createQueryBuilder('ingredient')
.leftJoin('ingredient.category', 'category')
.leftJoin('ingredient.unit', 'unit')

    TypeOrmCriteriaConverter.convert(queryBuilder, criteria)

    queryBuilder.select([
      'ingredient.id AS ingredient_id',
      'ingredient.name AS ingredient_name',
      // ... todos los campos
    ])

    const [results, total] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount()
    ])

    const data = results.map(row =>
      IngredientListItemResponse.fromQueryResult(row)
    )

    return new PaginatedResult(
      data,
      total,
      criteria.pagination?.page ?? 1,
      criteria.pagination?.pageSize ?? 20
    )

}
}

// 4. Registro en módulo
@Module({
providers: [
// Abstracción → Implementación
{
provide: IngredientQueryService,
useClass: TypeOrmIngredientQueryService
},
SearchIngredientsWithDetails,
SearchIngredientsWithDetailsHandler
]
})
export class IngredientModule {}
Ventajas:
✅ Arquitectura limpia (Application no conoce TypeORM)
✅ Testeable (mockear abstracción)
✅ Intercambiable (cambiar implementación sin tocar use case)
Desventajas:
❌ Más archivos (abstracción + implementación)
❌ El DTO IngredientListItemResponse en Application (debatible)
