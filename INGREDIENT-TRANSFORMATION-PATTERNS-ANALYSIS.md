# Análisis de Patrones para Transformación de Ingredientes

## 🎯 Contexto del Problema

**Situación:** Un ingrediente crudo (ej: "Morro de Res Crudo") se transforma en un ingrediente preparado (ej: "Morro de Res Preparado") mediante un proceso de cocción/preparación.

**Desafío:** ¿Cómo modelar y gestionar esta relación de manera óptima?

---

## 📊 Investigación de la Industria

### Fuentes Analizadas:
- ✅ **ERP Systems:** SAP, Oracle, Microsoft Dynamics 365
- ✅ **Manufacturing:** Bill of Materials (BOM) patterns, multi-level BOMs
- ✅ **Food Industry:** Restaurant inventory systems, recipe management
- ✅ **DDD Patterns:** Domain-Driven Design best practices
- ✅ **Traceability:** Food manufacturing lot tracking (FDA compliance)

---

## 🏗️ 5 Opciones de Implementación

---

## **OPCIÓN 1: Ingredientes Independientes con Recetas de Transformación** ⭐ (ACTUAL)

### 📋 Descripción

Ingredientes raw y prepared son **entidades completamente separadas**, vinculadas únicamente a través de un agregado `PreparationRecipe` que define la transformación.

### 🏗️ Modelo de Datos

```typescript
Ingredient (Aggregate)
  ├── id: UUID
  ├── name: string
  ├── ingredientCategoryId: UUID
  ├── unitId: UUID
  └── ...otros campos independientes

PreparationRecipe (Aggregate)
  ├── id: UUID
  ├── name: string
  ├── baseIngredientId: UUID → references Ingredient
  ├── outputIngredientId: UUID → references Ingredient
  ├── yieldPercentage: decimal (referencial)
  └── additionalIngredients: []

IngredientTransformation (Immutable Record)
  ├── id: UUID
  ├── recipeId: UUID
  ├── baseIngredientId: UUID
  ├── outputIngredientId: UUID
  ├── inputQuantity: decimal
  ├── outputQuantity: decimal (REAL - ingresada por usuario)
  ├── wasteQuantity: decimal (calculada)
  └── costs, timestamps...
```

### ✅ Ventajas

1. **Simplicidad DDD:** Cada ingrediente es un bounded context independiente
2. **Flexibilidad:** Un ingrediente crudo puede tener múltiples preparaciones diferentes
3. **Bajo acoplamiento:** Cambios en un ingrediente no afectan al otro
4. **Escalabilidad:** Fácil agregar nuevos ingredientes y recetas
5. **Trazabilidad completa:** Registro inmutable de cada transformación
6. **Testing:** Fácil de testear por separado
7. **Queries simples:** `SELECT * FROM ingredients WHERE name LIKE '%Preparado%'`
8. **Mantenibilidad:** Código limpio y claro

### ❌ Desventajas

1. **Nomenclatura manual:** Riesgo de inconsistencias ("Preparado" vs "Cocido")
2. **No hay vínculo directo:** Para encontrar el crudo de un preparado necesitas buscar en recipes
3. **Duplicación conceptual:** Mismos campos (category, unit) en ambos ingredientes
4. **Sin validación automática:** No impide crear múltiples "Morro Preparado"
5. **Búsquedas complejas:** Queries que relacionen raw/prepared requieren JOINs

### 🎯 Cuándo Usar

- ✅ Sistema con **pocos ingredientes transformados** (< 20% del total)
- ✅ **Transformaciones complejas** con muchos ingredientes adicionales
- ✅ **Múltiples outputs** de un mismo input (ej: pollo → pechuga, muslo, alitas)
- ✅ Prioridad en **simplicidad y mantenibilidad**
- ✅ Equipo familiarizado con **DDD puro**
- ✅ **Negocio en crecimiento** que necesita flexibilidad

### 🏭 Industrias que lo Usan

- **Restaurant POS Systems:** Toast, Square, Lightspeed
- **Small-scale food production**
- **Craft manufacturing**
- **Cloud kitchens**

### 📊 Comparación con Estándares

**SAP/Oracle:** ❌ No usa este patrón (usan material types)
**Microsoft Dynamics 365:** ⚠️ Parcialmente (permite pero no recomienda)
**Restaurant Software:** ✅ Patrón común en sistemas pequeños/medianos

### 🎓 Evaluación DDD

- **Bounded Contexts:** ⭐⭐⭐⭐⭐ (Excelente separación)
- **Ubiquitous Language:** ⭐⭐⭐⭐ (Claro pero requiere naming conventions)
- **Aggregate Independence:** ⭐⭐⭐⭐⭐ (100% independientes)
- **Event-Driven:** ⭐⭐⭐⭐⭐ (Eventos claros: IngredientTransformed)

### 💰 Costo de Implementación

- **Setup:** ⭐⭐⭐⭐⭐ (Muy bajo, ya implementado)
- **Maintenance:** ⭐⭐⭐⭐⭐ (Muy bajo)
- **Learning Curve:** ⭐⭐⭐⭐⭐ (Muy bajo)

---

## **OPCIÓN 2: Material Type Pattern (SAP/Oracle Style)** 🏢

### 📋 Descripción

Todos los materiales (raw, semi-finished, finished) son del mismo tipo de entidad pero con un campo `materialType` que distingue su naturaleza. Inspirado en SAP Material Master.

### 🏗️ Modelo de Datos

```typescript
Material (Aggregate Root)
  ├── id: UUID
  ├── name: string
  ├── materialType: enum (RAW, SEMI_FINISHED, FINISHED)
  ├── baseRawMaterialId: UUID? → self-reference (opcional)
  ├── categoryId: UUID
  ├── unitId: UUID
  ├── valuationClass: enum (RAW_MATERIAL, WIP, FINISHED_GOODS)
  ├── procurementType: enum (PURCHASE, PRODUCTION, BOTH)
  ├── isActive: boolean
  └── ...otros campos

MaterialBOM (Bill of Materials)
  ├── id: UUID
  ├── parentMaterialId: UUID → Material (output)
  ├── bomItems: []
  │   ├── componentMaterialId: UUID → Material
  │   ├── quantityPerUnit: decimal
  │   └── operationSequence: int
  ├── yieldPercentage: decimal
  └── isActive: boolean

ProductionOrder (Transformation Record)
  ├── id: UUID
  ├── bomId: UUID
  ├── outputMaterialId: UUID (debe ser SEMI_FINISHED o FINISHED)
  ├── status: enum (PLANNED, RELEASED, IN_PROGRESS, COMPLETED)
  ├── plannedQuantity: decimal
  ├── actualQuantity: decimal
  └── wipCost: decimal (costo acumulado en proceso)
```

### 🔧 Implementación

```typescript
enum MaterialType {
  RAW = 'RAW',                    // Ingrediente crudo comprado
  SEMI_FINISHED = 'SEMI_FINISHED', // Ingrediente preparado/cocido
  FINISHED = 'FINISHED'            // Producto final (sanguche)
}

enum ProcurementType {
  PURCHASE = 'PURCHASE',     // Se compra a proveedor
  PRODUCTION = 'PRODUCTION', // Se produce internamente
  BOTH = 'BOTH'              // Puede comprarse o producirse
}

class Material extends AggregateRoot {
  constructor(
    public readonly id: MaterialId,
    private name: MaterialName,
    private materialType: MaterialType,
    private baseRawMaterialId: MaterialId | null, // ← Link to raw material
    private procurementType: ProcurementType,
    // ...otros campos
  ) { super() }

  static createRaw(id: string, name: string, ...): Material {
    return new Material(
      new MaterialId(id),
      new MaterialName(name),
      MaterialType.RAW,
      null, // No tiene base material
      ProcurementType.PURCHASE,
      ...
    )
  }

  static createSemiFinished(
    id: string,
    name: string,
    baseRawMaterialId: string, // ← Requerido para semi-finished
    ...
  ): Material {
    if (!baseRawMaterialId) {
      throw new SemiFinishedRequiresBaseRawMaterial()
    }

    return new Material(
      new MaterialId(id),
      new MaterialName(name),
      MaterialType.SEMI_FINISHED,
      new MaterialId(baseRawMaterialId), // ← Link explícito
      ProcurementType.PRODUCTION,
      ...
    )
  }

  isRaw(): boolean {
    return this.materialType === MaterialType.RAW
  }

  isSemiFinished(): boolean {
    return this.materialType === MaterialType.SEMI_FINISHED
  }

  requiresProduction(): boolean {
    return this.procurementType !== ProcurementType.PURCHASE
  }

  getBaseRawMaterial(): MaterialId | null {
    return this.baseRawMaterialId
  }
}

// Repository con queries específicos
class MaterialRepository {
  async findSemiFinishedByBase(baseRawMaterialId: string): Promise<Material[]> {
    return this.find({
      where: {
        materialType: MaterialType.SEMI_FINISHED,
        baseRawMaterialId
      }
    })
  }

  async findByType(type: MaterialType): Promise<Material[]> {
    return this.find({ where: { materialType: type } })
  }
}
```

### ✅ Ventajas

1. **Estándar de la industria:** SAP, Oracle, Dynamics usan este patrón
2. **Vínculo explícito:** `baseRawMaterialId` conecta directamente raw → semi-finished
3. **Queries eficientes:** `WHERE materialType = 'SEMI_FINISHED'`
4. **Valuation clara:** Cada tipo tiene su clase de valoración (contabilidad)
5. **Procurement logic:** Define si se compra, produce, o ambos
6. **BOM estructurado:** Bill of Materials multi-nivel (sub-ensambles)
7. **Reporting potente:** Análisis por tipo de material
8. **FDA compliance ready:** Facilita trazabilidad lot-to-lot
9. **Validación automática:** Semi-finished DEBE tener baseRawMaterialId

### ❌ Desventajas

1. **Complejidad adicional:** Más campos en el modelo (materialType, valuationClass, etc.)
2. **Acoplamiento:** Agregado único con múltiples responsabilidades
3. **Testing más complejo:** Necesitas mockear diferentes tipos
4. **Tabla grande:** Todos los materiales en una sola tabla
5. **Migraciones:** Cambiar tipo de material puede ser complejo
6. **Over-engineering:** Para sistemas pequeños puede ser excesivo

### 🎯 Cuándo Usar

- ✅ **Gran volumen** de materiales transformados (>100)
- ✅ Múltiples niveles de transformación (raw → semi → finished → packaged)
- ✅ Requiere **contabilidad por tipo** de material
- ✅ Necesitas **reportes complejos** por categoría de material
- ✅ Integración con **sistemas ERP existentes**
- ✅ **Trazabilidad FDA** requerida
- ✅ **Cadena de restaurantes** o producción centralizada

### 🏭 Industrias que lo Usan

- **SAP S/4HANA:** Material Master (MARA table)
- **Oracle EBS:** Inventory Items con Item Type
- **Microsoft Dynamics 365:** Product lifecycle states
- **Large-scale food manufacturing:** Nestlé, Unilever
- **Pharmaceutical industry** (regulado por FDA)

### 📊 Comparación con Estándares

**SAP/Oracle:** ✅✅✅✅✅ Patrón estándar
**Microsoft Dynamics 365:** ✅✅✅✅ Usa product types
**Restaurant Software:** ⚠️ Solo en enterprise-level (ej: MarketMan Enterprise)

### 🎓 Evaluación DDD

- **Bounded Contexts:** ⭐⭐⭐ (Único agregado con múltiples tipos)
- **Ubiquitous Language:** ⭐⭐⭐⭐⭐ (Terminología universal de la industria)
- **Aggregate Independence:** ⭐⭐ (Acoplados por tipo y baseRawMaterialId)
- **Event-Driven:** ⭐⭐⭐⭐ (Eventos claros por tipo)

### 💰 Costo de Implementación

- **Setup:** ⭐⭐ (Refactoring significativo)
- **Maintenance:** ⭐⭐⭐⭐ (Medio, bien estructurado)
- **Learning Curve:** ⭐⭐⭐ (Requiere entender material types)

---

## **OPCIÓN 3: Product Lifecycle State Pattern** 🔄

### 📋 Descripción

Un único ingrediente con **estados de ciclo de vida** que representan su transformación progresiva. Similar a Microsoft Dynamics 365 Product Lifecycle Management.

### 🏗️ Modelo de Datos

```typescript
Ingredient (Aggregate Root con State Machine)
  ├── id: UUID
  ├── baseName: string (ej: "Morro de Res")
  ├── currentState: enum (RAW, PROCESSING, PREPARED, EXPIRED)
  ├── stateHistory: []
  │   ├── timestamp: datetime
  │   ├── fromState: State
  │   ├── toState: State
  │   ├── quantity: decimal
  │   └── triggeredBy: string
  ├── categoryId: UUID
  └── ...otros campos

IngredientStateTransition (Domain Event)
  ├── ingredientId: UUID
  ├── fromState: State
  ├── toState: State
  ├── transitionDate: datetime
  ├── quantityBefore: decimal
  ├── quantityAfter: decimal
  └── metadata: {}

BatchInventory (tracks state per batch)
  ├── id: UUID
  ├── ingredientId: UUID
  ├── batchNumber: string
  ├── state: State
  ├── quantity: decimal
  └── lastStateChange: datetime
```

### 🔧 Implementación

```typescript
enum IngredientState {
  RAW = 'RAW',
  PROCESSING = 'PROCESSING',
  PREPARED = 'PREPARED',
  EXPIRED = 'EXPIRED'
}

class IngredientStateMachine {
  private static readonly ALLOWED_TRANSITIONS = {
    [IngredientState.RAW]: [IngredientState.PROCESSING, IngredientState.EXPIRED],
    [IngredientState.PROCESSING]: [IngredientState.PREPARED],
    [IngredientState.PREPARED]: [IngredientState.EXPIRED],
    [IngredientState.EXPIRED]: []
  }

  canTransition(from: IngredientState, to: IngredientState): boolean {
    return this.ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
  }

  validateTransition(from: IngredientState, to: IngredientState): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransition(from, to)
    }
  }
}

class Ingredient extends AggregateRoot {
  constructor(
    public readonly id: IngredientId,
    private baseName: string,
    private currentState: IngredientState,
    private stateHistory: StateTransition[]
  ) { super() }

  transitionTo(newState: IngredientState, quantity: number, triggeredBy: string): void {
    const stateMachine = new IngredientStateMachine()
    stateMachine.validateTransition(this.currentState, newState)

    const previousState = this.currentState

    this.stateHistory.push({
      fromState: previousState,
      toState: newState,
      quantity,
      timestamp: new Date(),
      triggeredBy
    })

    this.currentState = newState

    this.record(new IngredientStateTransitioned({
      ingredientId: this.id.value,
      fromState: previousState,
      toState: newState,
      quantity,
      triggeredBy
    }))
  }

  getCurrentDisplayName(): string {
    // Nombres dinámicos según estado
    const stateNames = {
      [IngredientState.RAW]: 'Crudo',
      [IngredientState.PROCESSING]: 'En Proceso',
      [IngredientState.PREPARED]: 'Preparado',
      [IngredientState.EXPIRED]: 'Vencido'
    }
    return `${this.baseName} - ${stateNames[this.currentState]}`
  }

  isPrepared(): boolean {
    return this.currentState === IngredientState.PREPARED
  }

  canBeSold(): boolean {
    return this.currentState === IngredientState.PREPARED
  }

  canBeProcessed(): boolean {
    return this.currentState === IngredientState.RAW
  }
}

// Batch-level tracking
class IngredientBatch {
  constructor(
    public readonly id: BatchId,
    public readonly ingredientId: IngredientId,
    private state: IngredientState,
    private quantity: Quantity
  ) {}

  transitionState(newState: IngredientState): void {
    // Cada batch puede estar en un estado diferente
    this.state = newState
  }
}
```

### ✅ Ventajas

1. **Modelo conceptual claro:** Un ingrediente, múltiples estados
2. **State transitions auditables:** Historial completo de cambios
3. **Validaciones de estado:** Restricciones automáticas (no puedes vender si está RAW)
4. **Lifecycle management:** Estados como EXPIRED, RECALLED
5. **Reporting simplificado:** Queries por estado actual
6. **Event sourcing ready:** Cada transición es un evento
7. **Business rules claras:** Estado determina operaciones permitidas
8. **Batch-level granularity:** Puedes tener diferentes lotes en diferentes estados

### ❌ Desventajas

1. **Estado compartido:** Complicado si tienes stock en múltiples estados simultáneamente
2. **Queries complejas:** "Dame todo el stock PREPARED" requiere aggregate state
3. **Inventario mixto:** Difícil manejar 5kg RAW + 3kg PREPARED del mismo ingrediente base
4. **Costos por estado:** Costo unitario cambia con el estado (complejo)
5. **Complejidad del state machine:** Necesitas validar transiciones permitidas
6. **No escalable:** Para transformaciones complejas con muchos pasos intermedios
7. **Nombres dinámicos:** UI debe manejar nombres que cambian según estado

### 🎯 Cuándo Usar

- ✅ **Transformaciones lineales** (A → B → C sin ramificaciones)
- ✅ **Estados bien definidos** y limitados (< 5 estados)
- ✅ Prioridad en **lifecycle tracking** (auditoría de estados)
- ✅ **Batch tracking crítico:** Cada lote puede estar en estado diferente
- ✅ Requieres **validaciones estrictas de estado** (ej: no vender si está RAW)
- ✅ **Workflow definido:** Proceso lineal predecible

### 🏭 Industrias que lo Usan

- **Microsoft Dynamics 365:** Product lifecycle states
- **Pharmaceutical industry:** Drug lifecycle (R&D → Clinical → Approved → Recalled)
- **Fashion industry:** Design → Sample → Production → Retail → Clearance
- **Wine industry:** Grape → Must → Fermenting → Aged → Bottled

### 📊 Comparación con Estándares

**SAP/Oracle:** ⚠️ Usan status pero no como patrón principal
**Microsoft Dynamics 365:** ✅✅✅✅ Patrón principal para PLM
**Restaurant Software:** ❌ Raramente usado

### 🎓 Evaluación DDD

- **Bounded Contexts:** ⭐⭐⭐⭐ (Único agregado con state machine)
- **Ubiquitous Language:** ⭐⭐⭐ (Estados deben reflejar el dominio)
- **Aggregate Independence:** ⭐⭐⭐⭐ (Un agregado, estado interno)
- **Event-Driven:** ⭐⭐⭐⭐⭐ (State transitions son eventos)

### 💰 Costo de Implementación

- **Setup:** ⭐⭐ (Requiere refactoring completo)
- **Maintenance:** ⭐⭐⭐ (Medio, state machine puede ser compleja)
- **Learning Curve:** ⭐⭐⭐ (Requiere entender state machines)

---

## **OPCIÓN 4: Intermediate Product Pattern (Semi-Finished Goods)** 🏭

### 📋 Descripción

Categorización explícita de productos como **raw materials**, **intermediate products** (WIP), y **finished goods**. Patrón estándar en manufactura y food production industrial.

### 🏗️ Modelo de Datos

```typescript
Product (Base Aggregate)
  ├── id: UUID
  ├── name: string
  ├── productCategory: enum (RAW_MATERIAL, INTERMEDIATE, FINISHED_GOOD)
  ├── productionInfo?: {
  │   ├── sourceProductId: UUID
  │   ├── productionRecipeId: UUID
  │   └── averageYield: decimal
  │ }
  ├── inventoryInfo: {
  │   ├── valuationClass: string (ej: "3000-Raw", "7900-Semi")
  │   ├── costingMethod: enum (FIFO, AVG, STANDARD)
  │   └── lotTracking: boolean
  │ }
  └── ...otros campos

ProductionRecipe (BOM - Bill of Materials)
  ├── id: UUID
  ├── outputProductId: UUID
  ├── recipeItems: []
  │   ├── inputProductId: UUID
  │   ├── productCategory: enum (solo RAW o INTERMEDIATE)
  │   ├── quantity: decimal
  │   └── unitId: UUID
  ├── yieldPercentage: decimal
  ├── routingOperations: []
  │   ├── sequence: int
  │   ├── operationName: string
  │   └── standardTime: decimal (minutos)
  └── isActive: boolean

ProductionOrder (Work Order)
  ├── id: UUID
  ├── recipeId: UUID
  ├── outputProductId: UUID (debe ser INTERMEDIATE o FINISHED)
  ├── status: enum (PLANNED, RELEASED, IN_PROGRESS, COMPLETED)
  ├── plannedQuantity: decimal
  ├── actualOutput: decimal
  ├── wipCost: decimal (costo acumulado en proceso)
  └── componentCosts: [] (costos por componente)
```

### 🔧 Implementación

```typescript
enum ProductCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  INTERMEDIATE = 'INTERMEDIATE',
  FINISHED_GOOD = 'FINISHED_GOOD'
}

enum ValuationClass {
  RAW_MATERIAL_3000 = '3000', // Contabilidad: cuenta 3000
  SEMI_FINISHED_7900 = '7900', // Contabilidad: cuenta 7900
  FINISHED_GOODS_7910 = '7910'
}

enum CostingMethod {
  FIFO = 'FIFO',
  AVERAGE = 'AVERAGE',
  STANDARD = 'STANDARD'
}

class Product extends AggregateRoot {
  constructor(
    public readonly id: ProductId,
    private name: string,
    private category: ProductCategory,
    private valuationClass: ValuationClass,
    private costingMethod: CostingMethod,
    private sourceProductId: ProductId | null, // Link to source (if INTERMEDIATE)
    private productionRecipeId: RecipeId | null
  ) { super() }

  static createRawMaterial(id: string, name: string, ...): Product {
    return new Product(
      new ProductId(id),
      name,
      ProductCategory.RAW_MATERIAL,
      ValuationClass.RAW_MATERIAL_3000,
      CostingMethod.FIFO,
      null,
      null
    )
  }

  static createIntermediateProduct(
    id: string,
    name: string,
    sourceProductId: string,
    recipeId: string,
    ...
  ): Product {
    return new Product(
      new ProductId(id),
      name,
      ProductCategory.INTERMEDIATE,
      ValuationClass.SEMI_FINISHED_7900,
      CostingMethod.FIFO,
      new ProductId(sourceProductId), // ← Link to raw material
      new RecipeId(recipeId)
    )
  }

  isIntermediate(): boolean {
    return this.category === ProductCategory.INTERMEDIATE
  }

  requiresProduction(): boolean {
    return this.category !== ProductCategory.RAW_MATERIAL
  }

  getValuationAccount(): string {
    // Para integración con sistemas contables
    return this.valuationClass
  }
}

class ProductionOrder extends AggregateRoot {
  constructor(
    public readonly id: ProductionOrderId,
    private recipeId: RecipeId,
    private outputProductId: ProductId,
    private status: ProductionOrderStatus,
    private wipCost: Money // Work-In-Progress cost
  ) { super() }

  complete(actualOutput: number, totalCost: Money): void {
    if (this.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw new InvalidProductionOrderStatus()
    }

    this.status = ProductionOrderStatus.COMPLETED
    this.wipCost = totalCost

    this.record(new ProductionOrderCompleted({
      orderId: this.id.value,
      outputProductId: this.outputProductId.value,
      actualOutput,
      totalCost: totalCost.amount,
      completedAt: new Date()
    }))
  }

  // WIP Accounting
  accumulateCost(additionalCost: Money): void {
    this.wipCost = this.wipCost.add(additionalCost)
  }
}

// Multi-level BOM support
class ProductionRecipe extends AggregateRoot {
  constructor(
    public readonly id: RecipeId,
    private outputProductId: ProductId,
    private recipeItems: RecipeItem[],
    private routingOperations: RoutingOperation[]
  ) { super() }

  // Permite BOMs multi-nivel (INTERMEDIATE puede usar otro INTERMEDIATE)
  canUseIntermediateProducts(): boolean {
    return true
  }

  // Calcula costo estándar basado en componentes
  calculateStandardCost(): Money {
    return this.recipeItems.reduce(
      (total, item) => total.add(item.getTotalCost()),
      new Money(0, 'PEN')
    )
  }
}
```

### ✅ Ventajas

1. **Claridad conceptual:** Distinción explícita raw/intermediate/finished
2. **Valuation accounting:** Diferentes clases de valoración contable
3. **WIP tracking:** Costos en proceso (Work-In-Progress)
4. **Multi-level BOMs:** Permite cadenas de producción (raw → semi → finished)
5. **Phantom items:** BOMs virtuales para simplificar
6. **Routing operations:** Define secuencia de operaciones
7. **Compliance:** Cumple con estándares contables (GAAP, IFRS)
8. **Lot traceability:** Rastreo completo de lotes por categoría
9. **Standard costing:** Soporte para costos estándar vs actual
10. **ERP integration:** Fácil integración con sistemas contables

### ❌ Desventajas

1. **Complejidad contable:** Requiere conocimientos de costing
2. **Setup inicial pesado:** Configurar valuation classes, costing methods
3. **Maintenance overhead:** Actualizar BOMs y routings
4. **Over-engineering:** Para negocios pequeños es excesivo
5. **Rigidez:** Cambiar categorías requiere re-configuración
6. **Learning curve:** Equipo necesita entender manufacturing concepts

### 🎯 Cuándo Usar

- ✅ **Multi-level transformations:** Raw → Semi → Finished (3+ niveles)
- ✅ **Contabilidad de costos crítica:** Necesitas WIP accounting
- ✅ **Gran escala:** >100 productos con transformaciones
- ✅ **Compliance regulatorio:** FDA, HACCP, ISO 22000
- ✅ **Integración con accounting systems** (QuickBooks, Xero, SAP FI)
- ✅ **Reportes financieros complejos:** Balance sheet por categoría
- ✅ **Central production facility:** Producción centralizada para múltiples locales

### 🏭 Industrias que lo Usan

- **Food Manufacturing:** General Mills, Nestlé, Unilever
- **Automotive:** Intermediate assemblies (engines, transmissions)
- **Electronics:** PCB assembly, sub-components
- **Pharmaceuticals:** Active ingredients → formulations → tablets
- **Beverage:** Concentrates → mixed products → packaged goods

### 📊 Comparación con Estándares

**SAP/Oracle:** ✅✅✅✅✅ Patrón core (standard costing, WIP)
**Microsoft Dynamics 365:** ✅✅✅✅✅ Production orders con BOM multi-nivel
**Restaurant Software:** ⚠️ Solo en enterprise-level (ej: MarketMan Enterprise)

### 🎓 Evaluación DDD

- **Bounded Contexts:** ⭐⭐⭐⭐ (Clara separación por categoría)
- **Ubiquitous Language:** ⭐⭐⭐⭐⭐ (Terminología universal de manufactura)
- **Aggregate Independence:** ⭐⭐⭐ (Vinculados por production orders)
- **Event-Driven:** ⭐⭐⭐⭐ (Production events bien definidos)

### 💰 Costo de Implementación

- **Setup:** ⭐ (Muy alto, requiere módulo completo)
- **Maintenance:** ⭐⭐ (Alto, BOMs y routings complejos)
- **Learning Curve:** ⭐ (Muy alto, requiere conocimiento de manufacturing)

---

## **OPCIÓN 5: Event Sourcing con Transformation Chain** 🔗

### 📋 Descripción

Modelar transformaciones como **cadenas de eventos** donde cada ingrediente tiene un historial completo de transformaciones. Enfoque event-driven puro con trazabilidad inmutable.

### 🏗️ Modelo de Datos

```typescript
Ingredient (Event-Sourced Aggregate)
  ├── id: UUID
  ├── name: string
  ├── events: [] (event stream)
  │   ├── IngredientCreated
  │   ├── IngredientPurchased
  │   ├── TransformationStarted
  │   ├── TransformationCompleted
  │   └── IngredientConsumed
  └── (estado reconstruido desde eventos)

TransformationChain (Read Model / Projection)
  ├── chainId: UUID
  ├── rootIngredientId: UUID (el crudo original)
  ├── transformations: []
  │   ├── fromIngredientId: UUID
  │   ├── toIngredientId: UUID
  │   ├── transformedAt: datetime
  │   └── quantityInOut: {}
  └── currentEndProducts: [] (todos los preparados derivados)

Event Store:
  - ingredient.created
  - ingredient.transformation_started
  - ingredient.transformation_completed
  - ingredient.intermediate_product_created
  - transformation.chain_extended (para multi-nivel)
```

### 🔧 Implementación

```typescript
// Domain Events
class IngredientTransformationStarted extends DomainEvent {
  constructor(
    public readonly transformationId: string,
    public readonly baseIngredientId: string,
    public readonly targetIngredientId: string,
    public readonly inputQuantity: number,
    public readonly startedBy: string,
    public readonly startedAt: Date
  ) {
    super('ingredient.transformation.started')
  }
}

class IngredientTransformationCompleted extends DomainEvent {
  constructor(
    public readonly transformationId: string,
    public readonly outputQuantity: number,
    public readonly wasteQuantity: number,
    public readonly actualYield: number,
    public readonly totalCost: number,
    public readonly completedAt: Date
  ) {
    super('ingredient.transformation.completed')
  }
}

class IntermediateProductCreated extends DomainEvent {
  constructor(
    public readonly productId: string,
    public readonly sourceIngredientId: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly createdAt: Date
  ) {
    super('ingredient.intermediate_product_created')
  }
}

// Event-Sourced Aggregate
class Ingredient extends EventSourcedAggregateRoot {
  private id: string
  private name: string
  private transformationHistory: TransformationEvent[] = []
  private currentQuantity: number = 0

  // Apply events to rebuild state
  apply(event: DomainEvent): void {
    if (event instanceof IngredientCreated) {
      this.id = event.ingredientId
      this.name = event.name
    }

    if (event instanceof IngredientPurchased) {
      this.currentQuantity += event.quantity
    }

    if (event instanceof IngredientTransformationCompleted) {
      this.transformationHistory.push({
        transformationId: event.transformationId,
        outputQuantity: event.outputQuantity,
        wasteQuantity: event.wasteQuantity,
        completedAt: event.completedAt
      })
      this.currentQuantity -= event.inputQuantity
    }
  }

  // Reconstruir desde event stream
  static fromEvents(events: DomainEvent[]): Ingredient {
    const ingredient = new Ingredient()
    events.forEach(event => ingredient.apply(event))
    return ingredient
  }

  // Command handler
  startTransformation(
    transformationId: string,
    targetIngredientId: string,
    inputQuantity: number,
    startedBy: string
  ): void {
    if (this.currentQuantity < inputQuantity) {
      throw new InsufficientIngredientQuantity(this.currentQuantity, inputQuantity)
    }

    const event = new IngredientTransformationStarted(
      transformationId,
      this.id,
      targetIngredientId,
      inputQuantity,
      startedBy,
      new Date()
    )

    this.addEvent(event)
  }
}

// Read Model (Projection) para queries optimizadas
class TransformationChainProjection {
  async on(event: IngredientTransformationCompleted): Promise<void> {
    // Actualizar read model para queries rápidas
    await this.db.transformationChains.update({
      where: { id: event.transformationId },
      data: {
        status: 'COMPLETED',
        outputQuantity: event.outputQuantity,
        wasteQuantity: event.wasteQuantity,
        completedAt: event.completedAt
      }
    })

    // Proyección para analytics
    await this.db.transformationAnalytics.insert({
      transformationId: event.transformationId,
      actualYield: event.actualYield,
      date: event.completedAt
    })
  }

  // Query: "Encuentra todas las transformaciones de un ingrediente"
  async findTransformationChain(ingredientId: string): Promise<TransformationChain> {
    return this.db.transformationChains.findOne({
      where: { rootIngredientId: ingredientId }
    })
  }

  // Temporal query: "¿Cuánto había en inventario el 15 de enero?"
  async getInventoryAtDate(ingredientId: string, date: Date): Promise<number> {
    const events = await this.eventStore.getEventsUntil(ingredientId, date)
    const ingredient = Ingredient.fromEvents(events)
    return ingredient.getCurrentQuantity()
  }
}

// Event Store Integration
class IngredientEventStore {
  async save(aggregateId: string, events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.db.eventStore.insert({
        aggregateId,
        eventType: event.eventName,
        eventData: JSON.stringify(event.toPrimitives()),
        timestamp: new Date(),
        version: await this.getNextVersion(aggregateId)
      })
    }
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const rows = await this.db.eventStore.findMany({
      where: { aggregateId },
      orderBy: { version: 'asc' }
    })

    return rows.map(row => this.deserializeEvent(row))
  }

  async getEventsUntil(aggregateId: string, date: Date): Promise<DomainEvent[]> {
    const rows = await this.db.eventStore.findMany({
      where: {
        aggregateId,
        timestamp: { lte: date }
      },
      orderBy: { version: 'asc' }
    })

    return rows.map(row => this.deserializeEvent(row))
  }
}
```

### ✅ Ventajas

1. **Trazabilidad completa:** Cada evento es inmutable y auditable
2. **Temporal queries:** Responde "¿qué había en inventario el 15 de enero?"
3. **Replay capabilities:** Reconstruir estado en cualquier momento
4. **Event-driven architecture:** Fácil integración con microservices
5. **Analytics potente:** Event stream para ML/BI
6. **Debugging:** Historial completo para troubleshooting
7. **Compliance:** Auditoría inherente (FDA, SOX, GDPR)
8. **Versioning:** Cambios en el modelo no afectan eventos históricos
9. **Scalability:** Event streams se escalan horizontalmente
10. **Real-time projections:** Múltiples read models para diferentes vistas

### ❌ Desventajas

1. **Complejidad arquitectónica:** Requiere event store, projections, CQRS
2. **Learning curve:** Event sourcing no es trivial
3. **Queries complejas:** Necesitas read models especializados
4. **Storage overhead:** Almacenar todos los eventos (puede ser TB)
5. **Eventual consistency:** Projections pueden tener lag
6. **Migraciones de eventos:** Versioning de eventos es complejo
7. **Performance:** Reconstruir agregados grandes puede ser lento
8. **Tooling:** Requiere infraestructura especializada (EventStoreDB, etc.)

### 🎯 Cuándo Usar

- ✅ **Auditoría crítica:** Regulado por FDA, SOX, GDPR
- ✅ **Trazabilidad end-to-end:** Rastreo desde proveedor hasta plato
- ✅ **Analytics avanzados:** ML sobre patrones de producción
- ✅ **Microservices architecture:** Event-driven system
- ✅ **Temporal queries requeridas:** "Estado en fecha X"
- ✅ Equipo con **experiencia en event sourcing y CQRS**
- ✅ **Blockchain-like requirements:** Inmutabilidad crítica

### 🏭 Industrias que lo Usan

- **Banking:** Event-sourced ledgers (transaction history)
- **Healthcare:** Patient event streams (HIPAA compliance)
- **Logistics:** Package tracking (chain of custody)
- **Blockchain-based supply chains:** Immutable event logs
- **High-frequency trading:** Audit trails

### 📊 Comparación con Estándares

**SAP/Oracle:** ⚠️ Usan change documents pero no full event sourcing
**Microsoft Dynamics 365:** ⚠️ Audit logs pero no event sourcing
**Restaurant Software:** ❌ Muy raro (complejidad innecesaria para la mayoría)

### 🎓 Evaluación DDD

- **Bounded Contexts:** ⭐⭐⭐⭐⭐ (Event streams por agregado)
- **Ubiquitous Language:** ⭐⭐⭐⭐ (Eventos reflejan acciones del dominio)
- **Aggregate Independence:** ⭐⭐⭐⭐⭐ (Event-driven desacopla completamente)
- **Event-Driven:** ⭐⭐⭐⭐⭐ (100% event-driven por definición)

### 💰 Costo de Implementación

- **Setup:** ⭐ (Muy alto, requiere infraestructura completa)
- **Maintenance:** ⭐ (Muy alto, event versioning complejo)
- **Learning Curve:** ⭐ (Muy alto, paradigma diferente)

---

## 📊 Matriz de Comparación Completa

| Criterio | Opción 1<br>Independientes ⭐ | Opción 2<br>Material Type 🏢 | Opción 3<br>State Machine 🔄 | Opción 4<br>Intermediate 🏭 | Opción 5<br>Event Sourcing 🔗 |
|----------|:-:|:-:|:-:|:-:|:-:|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Escalabilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Trazabilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Queries** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Contabilidad** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Compliance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **DDD Puro** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Mantenibilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Costo Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ | ⭐ |
| **Learning Curve** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ |
| **Time to Market** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐ |

---

## 🎯 Recomendaciones por Escenario

### 🍔 **Restaurante Pequeño/Mediano (< 50 ingredientes transformados)**

**Recomendación:** **Opción 1 - Ingredientes Independientes** (ACTUAL) ⭐

**Razón:**
- ✅ Simplicidad máxima
- ✅ Fácil mantenimiento
- ✅ Testing sencillo
- ✅ Suficiente para la escala
- ✅ Time to market rápido
- ✅ Equipo puede mantenerlo sin especialización

**Mejoras sugeridas:**
```typescript
// 1. Convención de nomenclatura estricta
"[Ingrediente Base] - Preparado"
"Morro de Res - Preparado"
"Pollo - Deshuesado"

// 2. Validación en frontend
if (name.includes("Preparado") || name.includes("Cocido")) {
  // Sugerir crear recipe
}

// 3. Query helper
async findRelatedIngredients(ingredientId: string) {
  // Buscar en recipes donde baseIngredientId = ingredientId
  // O donde outputIngredientId = ingredientId
}
```

**NO cambiar si:**
- Tienes < 100 ingredientes totales
- < 20% son ingredientes transformados
- No requieres contabilidad de costos por categoría

---

### 🏪 **Cadena de Restaurantes (50-200 ingredientes transformados)**

**Recomendación:** **Opción 2 - Material Type Pattern** 🏢

**Razón:**
- ✅ Estándar de la industria
- ✅ Escalabilidad probada
- ✅ Reporting potente por tipo
- ✅ Preparado para integraciones ERP
- ✅ Contabilidad clara por categoría

**Implementación incremental:**

**Fase 1:** Agregar campos a Ingredient existente
```typescript
class Ingredient {
  materialType?: MaterialType  // Nullable, default: RAW
  baseRawMaterialId?: UUID
  procurementType?: ProcurementType
}
```

**Fase 2:** Migrar datos existentes
```sql
-- Identificar preparados por nombre
UPDATE ingredients
SET material_type = 'SEMI_FINISHED'
WHERE name LIKE '%Preparado%' OR name LIKE '%Cocido%'

-- Los demás son RAW
UPDATE ingredients
SET material_type = 'RAW'
WHERE material_type IS NULL
```

**Fase 3:** Vincular con recipes
```typescript
// Actualizar baseRawMaterialId desde preparation_recipes
```

**Fase 4:** Hacer campos obligatorios
```typescript
materialType: MaterialType  // Ya no nullable
```

---

### 🏭 **Central de Producción / Manufactura (>200 productos, multi-nivel)**

**Recomendación:** **Opción 4 - Intermediate Product Pattern** 🏭

**Razón:**
- ✅ Multi-level BOMs soportados
- ✅ WIP accounting necesario
- ✅ Valuation classes para contabilidad
- ✅ Compliance FDA/ISO ready
- ✅ Production order workflow
- ✅ Routing operations

**Requiere módulos adicionales:**
- Módulo de contabilidad de costos
- BOM management system
- Production planning (MRP)
- Quality control integration

**Ejemplo multi-nivel:**
```
Raw Material: Pollo Entero
  ↓ Recipe 1
Intermediate: Pollo Deshuesado
  ↓ Recipe 2
Intermediate: Pollo Marinado
  ↓ Recipe 3
Finished Good: Sanguche de Pollo
```

---

### 🔬 **Industria Regulada (Pharma, Medical Devices)**

**Recomendación:** **Opción 5 - Event Sourcing** 🔗

**Razón:**
- ✅ Trazabilidad inmutable (FDA requirement)
- ✅ Auditoría completa inherente
- ✅ Temporal queries (investigación de recalls)
- ✅ Compliance regulatorio built-in
- ✅ Chain of custody tracking

**Requiere:**
- Event store (EventStoreDB, Kafka)
- CQRS infrastructure
- Read model projections
- Event versioning strategy
- Snapshots para performance

---

## 💡 Mi Recomendación Final para La Sanguchería POS

### **Opción Híbrida: Mantener Opción 1 + Agregar Elementos de Opción 2**

### 🎯 Estrategia: Mejora Incremental Sin Breaking Changes

#### **Fase 1: Agregar Campos Opcionales (Backward Compatible)**

```typescript
// src/modules/ingredients/domain/ingredient.ts

enum IngredientUsageType {
  PURCHASED = 'PURCHASED',      // Se compra del proveedor
  PRODUCED = 'PRODUCED',        // Se produce internamente
  BOTH = 'BOTH'                 // Puede comprarse O producirse
}

interface IngredientPrimitives {
  id: string
  name: string
  // ... campos existentes ...

  // ✅ NUEVOS CAMPOS (opcionales para no romper)
  sourceIngredientId?: string | null  // Link opcional al ingrediente crudo
  usageType?: IngredientUsageType    // Cómo se obtiene
}

class Ingredient extends AggregateRoot {
  constructor(
    public readonly id: IngredientId,
    private name: IngredientName,
    // ... campos existentes ...
    private sourceIngredientId: IngredientId | null,  // ← Nuevo
    private usageType: IngredientUsageType             // ← Nuevo
  ) {
    super()
  }

  // Factory method mejorado
  static create(
    id: string,
    name: string,
    // ... otros params ...
    sourceIngredientId?: string | null,
    usageType: IngredientUsageType = IngredientUsageType.PURCHASED
  ): Ingredient {
    return new Ingredient(
      new IngredientId(id),
      new IngredientName(name),
      // ...
      sourceIngredientId ? new IngredientId(sourceIngredientId) : null,
      usageType
    )
  }

  // Helper methods
  isProduced(): boolean {
    return this.usageType === IngredientUsageType.PRODUCED
  }

  isPurchased(): boolean {
    return this.usageType === IngredientUsageType.PURCHASED
  }

  hasSourceIngredient(): boolean {
    return this.sourceIngredientId !== null
  }

  getSourceIngredientId(): IngredientId | null {
    return this.sourceIngredientId
  }
}
```

#### **Fase 2: Extender Repository con Query Helpers**

```typescript
// src/modules/ingredients/domain/repositories/ingredient.repository.ts

export abstract class IngredientRepository {
  // Métodos existentes
  abstract save(ingredient: Ingredient): Promise<void>
  abstract search(id: IngredientId): Promise<Ingredient | null>
  abstract searchAll(): Promise<Ingredient[]>

  // ✅ NUEVOS MÉTODOS
  abstract findBySourceIngredient(sourceId: IngredientId): Promise<Ingredient[]>
  abstract findProducedIngredients(): Promise<Ingredient[]>
  abstract findPurchasedIngredients(): Promise<Ingredient[]>
}

// Implementación TypeORM
export class TypeOrmIngredientRepository implements IngredientRepository {
  async findBySourceIngredient(sourceId: IngredientId): Promise<Ingredient[]> {
    const entities = await this.repository.find({
      where: { sourceIngredientId: sourceId.value }
    })
    return entities.map(e => Ingredient.fromPrimitives(e))
  }

  async findProducedIngredients(): Promise<Ingredient[]> {
    const entities = await this.repository.find({
      where: { usageType: IngredientUsageType.PRODUCED }
    })
    return entities.map(e => Ingredient.fromPrimitives(e))
  }
}
```

#### **Fase 3: Migration Script**

```sql
-- Migration: Add optional fields
ALTER TABLE ingredients
ADD COLUMN source_ingredient_id UUID NULL,
ADD COLUMN usage_type VARCHAR(20) DEFAULT 'PURCHASED',
ADD CONSTRAINT fk_source_ingredient
  FOREIGN KEY (source_ingredient_id) REFERENCES ingredients(id);

-- Create index for performance
CREATE INDEX idx_ingredients_source ON ingredients(source_ingredient_id);
CREATE INDEX idx_ingredients_usage_type ON ingredients(usage_type);

-- Populate sourceIngredientId from existing recipes
UPDATE ingredients i
SET source_ingredient_id = pr.base_ingredient_id,
    usage_type = 'PRODUCED'
FROM preparation_recipes pr
WHERE i.id = pr.output_ingredient_id;
```

#### **Fase 4: Convenciones de Nomenclatura**

```typescript
// Naming convention helper
class IngredientNamingConvention {
  static PREPARED_SUFFIX = ' - Preparado'
  static COOKED_SUFFIX = ' - Cocido'
  static PROCESSED_SUFFIX = ' - Procesado'

  static suggestPreparedName(baseName: string): string {
    return `${baseName}${this.PREPARED_SUFFIX}`
  }

  static extractBaseName(preparedName: string): string {
    return preparedName
      .replace(this.PREPARED_SUFFIX, '')
      .replace(this.COOKED_SUFFIX, '')
      .replace(this.PROCESSED_SUFFIX, '')
  }

  static isPreparedIngredient(name: string): boolean {
    return (
      name.includes(this.PREPARED_SUFFIX) ||
      name.includes(this.COOKED_SUFFIX) ||
      name.includes(this.PROCESSED_SUFFIX)
    )
  }
}

// Validación en create
class CreateIngredient {
  async run(...) {
    if (IngredientNamingConvention.isPreparedIngredient(name)) {
      // Sugerir establecer usageType = PRODUCED
      // Y vincular con sourceIngredientId
    }
  }
}
```

#### **Fase 5: Frontend Helpers**

```typescript
// Frontend: Crear ingrediente preparado
async function createPreparedIngredient(baseIngredientId: string) {
  const baseIngredient = await fetchIngredient(baseIngredientId)

  // Sugerir nombre
  const suggestedName = IngredientNamingConvention.suggestPreparedName(
    baseIngredient.name
  )

  return {
    id: generateUUID(),
    name: suggestedName,
    sourceIngredientId: baseIngredientId,  // ← Auto-vinculado
    usageType: 'PRODUCED',
    // ... copiar category, unit del base
    ingredientCategoryId: baseIngredient.ingredientCategoryId,
    unitId: baseIngredient.unitId
  }
}

// Query helper: Mostrar ingrediente con su origen
function displayIngredientWithSource(ingredient) {
  if (ingredient.sourceIngredientId) {
    return `${ingredient.name} (de ${ingredient.sourceIngredient.name})`
  }
  return ingredient.name
}
```

---

## 🎨 Beneficios de la Opción Híbrida

### ✅ Ventajas:

1. **Backward compatible:** No rompe código existente
2. **Mejora incremental:** Se implementa en fases
3. **Vínculo explícito:** `sourceIngredientId` conecta raw → prepared
4. **Queries eficientes:** Índices en campos clave
5. **Preparado para escalar:** Fácil migrar a Material Type si crece
6. **Bajo riesgo:** Campos opcionales, no obligatorios
7. **Mantiene simplicidad:** No over-engineering
8. **Migración gradual:** Datos existentes siguen funcionando

### 🚀 Path to Scale:

```
AHORA (< 50 ingredientes preparados)
  ↓ Fase 1-5: Agregar campos opcionales
Opción 1 Mejorada
  ↓ Si crece > 100 ingredientes
Opción 2: Material Type Pattern
  ↓ Si crece > 500 productos multi-nivel
Opción 4: Intermediate Product Pattern
```

---

## 📚 Referencias de la Industria

### Estándares ERP:
- **SAP Material Master:** Material Types (FERT, HALB, ROH) - Material Master Data
- **Oracle Inventory:** Make-or-Buy flag, BOM structures
- **Microsoft Dynamics 365:** Product lifecycle states, Product categories

### Food Industry Standards:
- **FDA 21 CFR Part 117:** HACCP requirements (traceability)
- **ISO 22000:2018:** Food safety management (lot tracking)
- **FSMA (Food Safety Modernization Act):** Traceability requirements

### Restaurant Inventory Systems:
- **Toast POS:** Recipe management with prep items
- **MarketMan:** Intermediate products for large-scale operations
- **WISK:** Semi-finished goods tracking

### DDD & Architecture:
- **Vaughn Vernon** - Implementing Domain-Driven Design (Aggregates, Events)
- **Eric Evans** - Domain-Driven Design (Blue Book) - Ubiquitous Language
- **Martin Fowler** - Patterns of Enterprise Application Architecture (Event Sourcing)

### Manufacturing:
- **APICS Dictionary** - Bill of Materials terminology
- **ISA-95** - Enterprise-Control System Integration (WIP tracking)

---

## 📝 Conclusiones

### Para La Sanguchería POS:

**Recomendación Final:** **Mantener Opción 1 + Mejoras Incrementales**

**Razones:**
1. ✅ Sistema actual es **simple y funcional**
2. ✅ Escala actual **no justifica complejidad adicional**
3. ✅ Mejoras incrementales **agregan valor sin riesgo**
4. ✅ Preparado para **escalar cuando sea necesario**
5. ✅ **Time to market** es crítico para startup

**Implementar:**
- ✅ Campos opcionales `sourceIngredientId` y `usageType`
- ✅ Convenciones de nomenclatura
- ✅ Query helpers para vincular ingredientes
- ✅ UI hints para crear ingredientes preparados

**NO implementar ahora:**
- ❌ Material Type Pattern (solo si > 100 ingredientes preparados)
- ❌ State Machine (complejidad innecesaria)
- ❌ Intermediate Product (over-engineering)
- ❌ Event Sourcing (demasiado complejo)

**Revisitar cuando:**
- Tengas > 100 ingredientes transformados
- Necesites contabilidad de costos por categoría
- Integres con sistema ERP externo
- Requieras compliance FDA/HACCP

---

**Fecha:** 2025-11-02
**Autor:** Análisis basado en investigación de industria (SAP, Oracle, MS Dynamics, FDA, ISO)
**Status:** ✅ Análisis Completo - Propuesta Final
**Decisión:** Mantener arquitectura actual + mejoras incrementales
