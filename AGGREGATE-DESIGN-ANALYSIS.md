# 🏗️ Análisis de Diseño de Agregados: Inventory Module

**Fecha:** 2025-11-04
**Contexto:** Refactorización de InventoryMovement - ¿Aggregate Root o Entity?
**Pregunta Clave:** ¿Guardar objetos completos o solo IDs dentro de un agregado?

---

## 🎯 La Pregunta Fundamental

```typescript
// Opción A: Colección de objetos completos
export class InventoryLevel extends AggregateRoot {
  private movements: InventoryMovement[]  // ← ¿Objetos completos?
}

// Opción B: Colección de IDs
export class InventoryLevel extends AggregateRoot {
  private movementIds: InventoryMovementId[]  // ← ¿Solo IDs?
}
```

**¿Cuál es correcto?**

---

## 📖 La Regla de DDD: Entidades vs Referencias

### Regla Principal (Vaughn Vernon):

> **"Within an Aggregate, use object references. Between Aggregates, use IDs only."**

**Traducción:**
- **DENTRO del agregado:** Usa objetos completos
- **ENTRE agregados:** Usa solo IDs

---

## 🔍 Análisis: ¿InventoryMovement está DENTRO o FUERA?

### Caso 1: Movement como Entity DENTRO del Agregado

Si `InventoryMovement` es una **Entity interna** de `InventoryLevel`:

```typescript
// ✅ CORRECTO: Objetos completos (están dentro del agregado)
export class InventoryLevel extends AggregateRoot {
  private movements: InventoryMovement[]  // ← Objetos completos

  recordPurchase(quantity: Quantity, ...): void {
    const movement = new InventoryMovement(...)
    this.movements.push(movement)  // ← Agregamos el objeto
    this.increase(quantity)
  }
}
```

**Por qué objetos completos:**
- ✅ Movements son **parte integral** del agregado
- ✅ No existen fuera de InventoryLevel
- ✅ Se persisten juntos (cascade)
- ✅ Se cargan juntos (eager loading puede ser útil)
- ✅ Comparten la misma transacción

**Analogía:**
```
Order (Aggregate Root)
└── OrderItems (Entities)  ← Objetos completos, no IDs

No guardas orderItemIds[], guardas OrderItem[] completos
```

---

### Caso 2: Movement como Aggregate Root SEPARADO

Si `InventoryMovement` es un **Aggregate Root independiente**:

```typescript
// ✅ CORRECTO: Solo IDs (están fuera del agregado)
export class InventoryLevel extends AggregateRoot {
  private movementIds: InventoryMovementId[]  // ← Solo IDs

  recordMovement(movementId: InventoryMovementId): void {
    this.movementIds.push(movementId)  // ← Solo guardas la referencia
  }
}
```

**Por qué solo IDs:**
- ✅ Movements son agregados separados
- ✅ Tienen su propio ciclo de vida
- ✅ Transacciones separadas
- ✅ Se cargan bajo demanda (lazy loading)
- ✅ Evita cargar objetos grandes

**Analogía:**
```
Order (Aggregate Root)
└── customerId: CustomerId  ← Solo ID, no Customer completo

No guardas el Customer completo, solo su ID
```

---

## 🎭 Comparación Visual

### Agregado Único (Movements Internos)

```
┌─────────────────────────────────────────────────┐
│ InventoryLevel (Aggregate Root)                 │
│                                                  │
│  - id: InventoryLevelId                         │
│  - ingredientId: IngredientId  ← FK externa     │
│  - currentQuantity: Quantity                    │
│  - movements: InventoryMovement[]  ← Objetos    │
│    └─ [                                         │
│         Movement { id, type, quantity, date },  │
│         Movement { id, type, quantity, date },  │
│         Movement { id, type, quantity, date }   │
│       ]                                         │
│                                                  │
│  ✅ Todo en una transacción                     │
│  ✅ Consistencia inmediata                      │
│  ✅ Movements no existen fuera de Level         │
└─────────────────────────────────────────────────┘
```

**Base de Datos:**
```sql
-- inventory_levels (aggregate root table)
CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY,
  ingredient_id UUID NOT NULL,
  current_quantity DECIMAL,
  ...
);

-- inventory_movements (entity table, PARTE del agregado)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  inventory_level_id UUID NOT NULL,  -- ← FK al aggregate root
  type VARCHAR,
  quantity DECIMAL,
  ...
  FOREIGN KEY (inventory_level_id) REFERENCES inventory_levels(id) ON DELETE CASCADE
);
```

---

### Agregados Separados (Movements Externos)

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ InventoryLevel (Aggregate 1) │       │ InventoryMovement (Agg 2)    │
│                              │       │                              │
│  - id: InventoryLevelId      │       │  - id: InventoryMovementId   │
│  - ingredientId: string      │◄──────│  - inventoryLevelId: string  │
│  - currentQuantity: Quantity │       │  - type: MovementType        │
│  - movementIds: string[]     │──────►│  - quantity: Quantity        │
│                              │       │  - createdAt: Date           │
│  ⚠️ 2 transacciones           │       │                              │
│  ⚠️ Consistencia eventual     │       │  ⚠️ Transacción separada      │
└──────────────────────────────┘       └──────────────────────────────┘
```

**Base de Datos:**
```sql
-- inventory_levels (aggregate 1)
CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY,
  ingredient_id UUID NOT NULL,
  current_quantity DECIMAL,
  ...
);

-- inventory_movements (aggregate 2, independiente)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  inventory_level_id UUID NOT NULL,  -- ← No hay CASCADE
  type VARCHAR,
  quantity DECIMAL,
  ...
  -- Sin ON DELETE CASCADE (agregado independiente)
);
```

---

## 🔬 Criterios de Decisión

### ¿Cómo decidir si Movement está DENTRO o FUERA?

#### Test 1: **¿Puede existir Movement sin Level?**

- **NO** → Movement es Entity DENTRO → Usa objetos completos
- **SÍ** → Movement es Aggregate FUERA → Usa solo IDs

**En tu caso:** Un movimiento de inventario **NO tiene sentido** sin un nivel de inventario.
**Conclusión:** Movement debería estar DENTRO.

---

#### Test 2: **¿Necesitas consistencia INMEDIATA?**

- **SÍ** → DENTRO del mismo agregado → Objetos completos
- **NO** (eventual está OK) → Agregados separados → Solo IDs

**En tu caso:** Cuando registras un movimiento, el level DEBE actualizarse inmediatamente.
**Conclusión:** Movement debería estar DENTRO.

---

#### Test 3: **¿Se carga Movement sin Level?**

- **NO** (siempre juntos) → DENTRO → Objetos completos
- **SÍ** (se consulta solo) → Agregados separados → Solo IDs

**En tu caso:** ¿Consultarás movements sin cargar el level?
- Si solo ves historial: Tal vez separados
- Si movements son audit trail de level: Dentro

---

#### Test 4: **¿Movement tiene lógica de negocio compleja?**

- **NO** (solo datos) → Entity DENTRO → Objetos completos
- **SÍ** (muchas reglas) → Aggregate FUERA → Solo IDs

**En tu caso:** Movement es principalmente un registro (tipo, cantidad, fecha).
**Conclusión:** Movement debería estar DENTRO.

---

## 🎯 Recomendación para Tu Caso

### ✅ Opción Recomendada: Movement como Entity DENTRO

```typescript
// domain/inventory-movement.ts
export interface InventoryMovementPrimitives {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  unitId: string
  reason: string | null
  referenceId: string | null
  createdAt: Date
}

// ❌ NO extends AggregateRoot
export class InventoryMovement {
  private constructor(
    public readonly id: InventoryMovementId,
    public readonly type: MovementType,
    public readonly quantity: Quantity,
    public readonly reason: string | null,
    public readonly referenceId: string | null,
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: number,
    unitId: string,
    reason?: string,
    referenceId?: string
  ): InventoryMovement {
    return new InventoryMovement(
      new InventoryMovementId(id),
      new MovementType(type),
      new Quantity(quantity, unitId),
      reason ?? null,
      referenceId ?? null,
      new Date()
    )
  }

  toPrimitives(): InventoryMovementPrimitives {
    return {
      id: this.id.value,
      type: this.type.value,
      quantity: this.quantity.value,
      unitId: this.quantity.unitId,
      reason: this.reason,
      referenceId: this.referenceId,
      createdAt: this.createdAt
    }
  }

  static fromPrimitives(primitives: InventoryMovementPrimitives): InventoryMovement {
    return new InventoryMovement(
      new InventoryMovementId(primitives.id),
      new MovementType(primitives.type),
      new Quantity(primitives.quantity, primitives.unitId),
      primitives.reason,
      primitives.referenceId,
      primitives.createdAt
    )
  }
}
```

---

### ✅ InventoryLevel con Movements (Objetos Completos)

```typescript
// domain/inventory-level.ts
export interface InventoryLevelPrimitives {
  id: string
  ingredientId: string
  currentQuantity: number
  unitId: string
  minimumQuantity: number | null
  maximumQuantity: number | null
  reorderPoint: number | null
  movements: InventoryMovementPrimitives[]  // ← Primitives de movements
  createdAt: Date
  updatedAt: Date
}

export class InventoryLevel extends AggregateRoot {
  private constructor(
    public readonly id: InventoryLevelId,
    public readonly ingredientId: IngredientId,
    private currentQuantity: Quantity,
    private minimumQuantity: Quantity | null,
    private maximumQuantity: Quantity | null,
    private reorderPoint: Quantity | null,
    private movements: InventoryMovement[],  // ← Objetos completos
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
    this.ensureCurrentQuantityIsNotNegative()
    this.ensureMinimumIsLessThanMaximum()
    this.ensureQuantitiesHaveSameUnit()
  }

  static create(
    id: string,
    ingredientId: string,
    initialQuantity: number,
    unitId: string,
    minimumQuantity: number | null = null,
    maximumQuantity: number | null = null,
    reorderPoint: number | null = null
  ): InventoryLevel {
    const now = new Date()

    // Crear el level con movements vacío
    const level = new InventoryLevel(
      new InventoryLevelId(id),
      new IngredientId(ingredientId),
      new Quantity(initialQuantity, unitId),
      minimumQuantity !== null ? new Quantity(minimumQuantity, unitId) : null,
      maximumQuantity !== null ? new Quantity(maximumQuantity, unitId) : null,
      reorderPoint !== null ? new Quantity(reorderPoint, unitId) : null,
      [],  // ← Movements vacío al crear
      now,
      now
    )

    // Si hay cantidad inicial, registrar movement IN
    if (initialQuantity > 0) {
      level.recordPurchase(initialQuantity, unitId, 'Initial stock')
    }

    return level
  }

  // ✅ Método para registrar compra (IN)
  recordPurchase(
    quantity: number,
    unitId: string,
    reason?: string,
    referenceId?: string
  ): void {
    const movementId = crypto.randomUUID()  // O generado por use case
    const movement = InventoryMovement.create(
      movementId,
      'IN',
      quantity,
      unitId,
      reason,
      referenceId
    )

    this.movements.push(movement)  // ← Agregamos objeto completo
    this.currentQuantity = this.currentQuantity.add(movement.quantity)
    this.updatedAt = new Date()
  }

  // ✅ Método para registrar salida (OUT)
  recordSale(
    quantity: number,
    unitId: string,
    reason?: string,
    referenceId?: string
  ): void {
    const quantityVO = new Quantity(quantity, unitId)
    this.ensureSameUnit(quantityVO)
    this.ensureSufficientStock(quantityVO)

    const movementId = crypto.randomUUID()
    const movement = InventoryMovement.create(
      movementId,
      'OUT',
      quantity,
      unitId,
      reason,
      referenceId
    )

    this.movements.push(movement)  // ← Agregamos objeto completo
    this.currentQuantity = this.currentQuantity.subtract(movement.quantity)
    this.updatedAt = new Date()

    this.checkAndEmitStockEvents()
  }

  // ✅ Método para ajuste manual
  recordAdjustment(
    newQuantity: number,
    unitId: string,
    reason: string
  ): void {
    const newQuantityVO = new Quantity(newQuantity, unitId)
    this.ensureSameUnit(newQuantityVO)

    const difference = newQuantity - this.currentQuantity.value
    const movementType = difference >= 0 ? 'IN' : 'OUT'
    const adjustmentQuantity = Math.abs(difference)

    const movementId = crypto.randomUUID()
    const movement = InventoryMovement.create(
      movementId,
      'ADJUSTMENT',
      adjustmentQuantity,
      unitId,
      reason
    )

    this.movements.push(movement)
    this.currentQuantity = newQuantityVO
    this.updatedAt = new Date()

    this.checkAndEmitStockEvents()
  }

  // ✅ Consultar historial (opcional, si necesitas)
  getMovements(): readonly InventoryMovement[] {
    return Object.freeze([...this.movements])  // Inmutable
  }

  getRecentMovements(limit: number): readonly InventoryMovement[] {
    return Object.freeze(
      [...this.movements]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
    )
  }

  // ... otros métodos (increase, decrease, setThresholds, etc.)

  toPrimitives(): InventoryLevelPrimitives {
    return {
      id: this.id.value,
      ingredientId: this.ingredientId.value,
      currentQuantity: this.currentQuantity.value,
      unitId: this.currentQuantity.unitId,
      minimumQuantity: this.minimumQuantity?.value ?? null,
      maximumQuantity: this.maximumQuantity?.value ?? null,
      reorderPoint: this.reorderPoint?.value ?? null,
      movements: this.movements.map(m => m.toPrimitives()),  // ← Serializamos movements
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: InventoryLevelPrimitives): InventoryLevel {
    return new InventoryLevel(
      new InventoryLevelId(primitives.id),
      new IngredientId(primitives.ingredientId),
      new Quantity(primitives.currentQuantity, primitives.unitId),
      primitives.minimumQuantity !== null
        ? new Quantity(primitives.minimumQuantity, primitives.unitId)
        : null,
      primitives.maximumQuantity !== null
        ? new Quantity(primitives.maximumQuantity, primitives.unitId)
        : null,
      primitives.reorderPoint !== null
        ? new Quantity(primitives.reorderPoint, primitives.unitId)
        : null,
      primitives.movements.map(m => InventoryMovement.fromPrimitives(m)),  // ← Reconstruimos
      primitives.createdAt,
      primitives.updatedAt
    )
  }

  // ... métodos privados de validación
}
```

---

## 🗄️ Persistencia con TypeORM

### Opción 1: Eager Loading (Recomendado para movements)

```typescript
// infrastructure/persistence/typeorm/inventory-level.entity.ts
@Entity('inventory_levels')
export class InventoryLevelEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'current_quantity' })
  currentQuantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  // ... other columns

  @OneToMany(() => InventoryMovementEntity, movement => movement.inventoryLevel, {
    cascade: true,   // ← Guardar movements automáticamente
    eager: true      // ← Cargar movements automáticamente
  })
  movements: InventoryMovementEntity[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

// infrastructure/persistence/typeorm/inventory-movement.entity.ts
@Entity('inventory_movements')
export class InventoryMovementEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'inventory_level_id' })
  inventoryLevelId: string

  @ManyToOne(() => InventoryLevelEntity, level => level.movements, {
    onDelete: 'CASCADE'  // ← Si se elimina el level, eliminar movements
  })
  @JoinColumn({ name: 'inventory_level_id' })
  inventoryLevel: InventoryLevelEntity

  @Column({ type: 'varchar', length: 20 })
  type: 'IN' | 'OUT' | 'ADJUSTMENT'

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  @Column({ type: 'text', nullable: true })
  reason: string | null

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_id' })
  referenceId: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
```

---

### Opción 2: Lazy Loading (Si movements pueden ser muchos)

```typescript
@Entity('inventory_levels')
export class InventoryLevelEntity {
  // ...

  @OneToMany(() => InventoryMovementEntity, movement => movement.inventoryLevel, {
    cascade: true,
    lazy: true  // ← Cargar solo cuando se accede
  })
  movements: Promise<InventoryMovementEntity[]>  // ← Promise!
}
```

**Uso:**
```typescript
const level = await repository.findById(levelId)
const movements = await level.movements  // ← Await extra
```

---

## 🔄 Repository Implementation

```typescript
// infrastructure/persistence/typeorm/typeorm-inventory-level.repository.ts
@Injectable()
export class TypeOrmInventoryLevelRepository implements InventoryLevelRepository {
  constructor(
    @InjectRepository(InventoryLevelEntity)
    private readonly repository: Repository<InventoryLevelEntity>
  ) {}

  async save(level: InventoryLevel): Promise<void> {
    const primitives = level.toPrimitives()

    // TypeORM automáticamente guarda los movements (cascade: true)
    const entity = this.repository.create({
      id: primitives.id,
      ingredientId: primitives.ingredientId,
      currentQuantity: primitives.currentQuantity,
      unitId: primitives.unitId,
      minimumQuantity: primitives.minimumQuantity,
      maximumQuantity: primitives.maximumQuantity,
      reorderPoint: primitives.reorderPoint,
      movements: primitives.movements.map(m => ({
        id: m.id,
        inventoryLevelId: primitives.id,
        type: m.type,
        quantity: m.quantity,
        unitId: m.unitId,
        reason: m.reason,
        referenceId: m.referenceId,
        createdAt: m.createdAt
      })),
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    })

    await this.repository.save(entity)
  }

  async search(id: InventoryLevelId): Promise<InventoryLevel | null> {
    // eager: true carga movements automáticamente
    const entity = await this.repository.findOne({
      where: { id: id.value }
    })

    if (!entity) return null

    return InventoryLevel.fromPrimitives({
      id: entity.id,
      ingredientId: entity.ingredientId,
      currentQuantity: entity.currentQuantity,
      unitId: entity.unitId,
      minimumQuantity: entity.minimumQuantity,
      maximumQuantity: entity.maximumQuantity,
      reorderPoint: entity.reorderPoint,
      movements: entity.movements.map(m => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        unitId: m.unitId,
        reason: m.reason,
        referenceId: m.referenceId,
        createdAt: m.createdAt
      })),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }

  // ✅ Ya NO necesitas InventoryMovementRepository separado
  // Los movements se guardan/cargan con el Level
}
```

---

## 📊 Comparación: Objetos vs IDs

| Aspecto | Objetos Completos | Solo IDs |
|---------|------------------|----------|
| **Cuándo usar** | Entities DENTRO del agregado | Referencias ENTRE agregados |
| **Consistencia** | Inmediata (transacción única) | Eventual (transacciones separadas) |
| **Carga de datos** | Eager/Lazy loading | Lazy (query separado) |
| **Cascade** | Sí (eliminar level elimina movements) | No |
| **Navegación** | `level.movements[0].quantity` | `movementRepo.findById(ids[0])` |
| **Complejidad** | Más simple | Más compleja |
| **Performance** | Puede cargar datos innecesarios | Solo carga lo que necesitas |

---

## ✅ Decisión Final para Tu Caso

### InventoryMovement como Entity DENTRO de InventoryLevel

**Razones:**
1. ✅ Movement no existe sin Level
2. ✅ Necesitan consistencia inmediata
3. ✅ Movement no tiene lógica compleja
4. ✅ Se consultan generalmente juntos
5. ✅ Simplifica el modelo

**Implementación:**
- `InventoryLevel` tiene `movements: InventoryMovement[]` (objetos completos)
- `InventoryMovement` NO extiende `AggregateRoot`
- TypeORM: `cascade: true`, `eager: true` (o `lazy: true` si son muchos)
- Solo un repositorio: `InventoryLevelRepository`

---

## 🚫 NO Hagas Esto

```typescript
// ❌ INCORRECTO: IDs dentro del agregado
export class InventoryLevel extends AggregateRoot {
  private movementIds: InventoryMovementId[]  // ← MAL si Movement está dentro
}

// ❌ INCORRECTO: Movements como Aggregate + Objetos completos
export class InventoryLevel extends AggregateRoot {
  private movements: InventoryMovement[]  // ← MAL si Movement es Aggregate
}

// ❌ INCORRECTO: 2 transacciones para algo atómico
await movementRepo.save(movement)  // Transacción 1
await levelRepo.save(level)        // Transacción 2 (riesgo de inconsistencia)
```

---

## 🎯 Resumen

| Si Movement es... | Entonces usa... | Porque... |
|-------------------|----------------|-----------|
| **Entity dentro de InventoryLevel** | `movements: InventoryMovement[]` (objetos) | Están en el mismo agregado, se persisten juntos |
| **Aggregate Root separado** | `movementIds: string[]` (solo IDs) | Están fuera del agregado, referencia débil |

**En tu caso:** Movement es Entity DENTRO → Usa objetos completos.

---

**¿Procedo con el refactoring implementando esta solución?**
