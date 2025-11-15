# 🎯 Estrategia de Actualización de InventoryLevel

**Fecha:** 2025-11-05
**Pregunta Clave:** ¿Qué evento debe actualizar el InventoryLevel?

---

## 🎯 Análisis: ¿Qué Evento Debe Actualizar el InventoryLevel?

### Opción 1: InventoryLevel escucha `PurchaseRegistered` / `SaleCompleted` / etc.

```
PurchaseRegistered → InventoryLevel actualiza stock
SaleCompleted → InventoryLevel actualiza stock
WasteRegistered → InventoryLevel actualiza stock
```

### Opción 2: InventoryLevel escucha `InventoryMovementCreated` (genérico)

```
InventoryMovementCreated (PURCHASE) → InventoryLevel actualiza
InventoryMovementCreated (SALE) → InventoryLevel actualiza
InventoryMovementCreated (WASTE) → InventoryLevel actualiza
```

---

## 🏗️ Análisis Arquitectural

### **Opción 1: Eventos Específicos de Negocio**

**Estructura:**
```
RegisterPurchase:
  ├─ Crear Batch
  ├─ Guardar Batch
  └─ Emitir: PurchaseRegistered

OnPurchaseRegistered (Subscriber):
  ├─ Crear Movement
  ├─ Guardar Movement
  └─ (no emite más eventos)

OnPurchaseRegistered (Otro Subscriber):
  ├─ Buscar/Crear Level
  ├─ level.increase(quantity)
  └─ Guardar Level
```

**Ventajas:**
- ✅ **Semántica clara**: "Compra" es lenguaje de negocio
- ✅ **Intención explícita**: Sabes POR QUÉ cambió el inventario
- ✅ **Múltiples subscribers**: Movement y Level escuchan lo mismo
- ✅ **Paralelización**: Movement y Level se actualizan en paralelo

**Desventajas:**
- ❌ **Acoplamiento**: InventoryLevel conoce eventos de otros contextos
- ❌ **Escalabilidad**: Si agregas nuevo tipo de movimiento, Level debe conocerlo
- ❌ **Duplicación**: Muchos eventos diferentes hacen lo mismo (actualizar Level)

---

### **Opción 2: Evento Genérico de Movement (RECOMENDADO)**

**Estructura:**
```
RegisterPurchase:
  ├─ Crear Batch
  ├─ Guardar Batch
  └─ Emitir: InventoryBatchCreated

OnInventoryBatchCreated:
  ├─ Crear Movement (PURCHASE)
  ├─ movement.record(InventoryMovementCreated)
  ├─ Guardar Movement
  └─ Emitir: InventoryMovementCreated

OnInventoryMovementCreated:
  ├─ Leer movement.type (PURCHASE, SALE, WASTE, etc.)
  ├─ Buscar/Crear Level
  ├─ if (movement.isInbound()) → level.increase()
  │   else → level.decrease()
  └─ Guardar Level
```

**Ventajas:**
- ✅ **Single Source of Truth**: Movement es LA fuente de verdad
- ✅ **Desacoplamiento**: Level NO conoce Purchase/Sale/Waste
- ✅ **Extensibilidad**: Nuevo tipo de movimiento → NO tocas Level
- ✅ **DDD puro**: Separación clara de responsabilidades
- ✅ **Audit trail**: Movement = registro inmutable, Level = vista derivada
- ✅ **Event Sourcing ready**: Level es una proyección de Movements

**Desventajas:**
- ❌ **Secuencial**: Movement DEBE crearse antes que Level (no paralelo)
- ❌ **Indirección**: Un paso extra en la cadena
- ❌ **Performance**: Dos eventos en lugar de uno (mínimo impacto)

---

## 🎓 ¿Qué Dicen los Expertos?

### **Eric Evans (DDD):**

> "Aggregates should model invariants. InventoryLevel represents the current state, while Movement represents the fact that changed it."

**Interpretación:**
- ✅ **Movement es el hecho inmutable** (event sourcing)
- ✅ **Level es el estado derivado** (proyección)
- ✅ **Level escucha Movement, NO la acción original**

### **Greg Young (Event Sourcing):**

> "Store events, derive state. The event stream is the source of truth, the aggregate state is a cache."

**Interpretación:**
- ✅ **InventoryMovement = Event Stream**
- ✅ **InventoryLevel = Projection/Cache**
- ✅ **Level se reconstruye desde Movements**

### **Martin Fowler (Event-Driven Architecture):**

> "Events should represent facts that happened, not commands. Movement is a fact, Purchase is a command."

**Interpretación:**
- ✅ **InventoryMovementCreated** = Fact (pasado)
- ⚠️ **PurchaseRegistered** = También un fact, pero de más alto nivel

---

## 🧠 Análisis Conceptual Profundo

### ¿Qué representa cada cosa?

```
┌────────────────────────────────────────────────────────┐
│                  NIVEL DE ABSTRACCIÓN                   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ALTO  │  Purchase/Sale/Waste  ← Intención de negocio  │
│        │  (Por qué cambió)                             │
│        │                                                │
│  MEDIO │  InventoryMovement  ← Registro del cambio     │
│        │  (Qué cambió)                                 │
│        │                                                │
│  BAJO  │  InventoryLevel  ← Estado resultante          │
│        │  (Cuánto hay ahora)                           │
│        │                                                │
└────────────────────────────────────────────────────────┘
```

### Flujo Lógico:

```
1. CAUSA (Intención):
   "Registrar compra de 50kg de Pollo"

2. EFECTO INMUTABLE (Hecho):
   "Se creó un Movement de tipo PURCHASE por 50kg"

3. CONSECUENCIA (Estado):
   "El Level de Pollo aumentó en 50kg"
```

### Pregunta clave: ¿De dónde viene la verdad?

**Si Level escucha `PurchaseRegistered`:**
```
Purchase → Level aumenta

Problema: ¿Y el Movement?
- Si Movement se crea después, hay una ventana donde:
  Level dice: 50kg
  Movements dice: 0 movements
  → INCONSISTENCIA
```

**Si Level escucha `InventoryMovementCreated`:**
```
Purchase → Movement creado → Level aumenta

Ventaja:
- Movement SIEMPRE existe cuando Level se actualiza
- Movement = fuente de verdad
- Level = proyección correcta
```

---

## 📊 Comparación Detallada

| Aspecto | Escucha Purchase/Sale | Escucha Movement |
|---------|----------------------|------------------|
| **Fuente de verdad** | Purchase es la verdad | Movement es la verdad ✅ |
| **Audit trail** | Purchase + Movement (duplicado) | Solo Movement ✅ |
| **Extensibilidad** | Cada nuevo tipo = nuevo evento | Un solo evento genérico ✅ |
| **Acoplamiento** | Level conoce Purchase/Sale/Waste | Level solo conoce Movement ✅ |
| **Paralelización** | Movement y Level en paralelo ✅ | Secuencial ⚠️ |
| **Event Sourcing** | Difícil reconstruir Level | Fácil: replay Movements ✅ |
| **Complejidad** | Simple ✅ | Un paso extra ⚠️ |
| **Consistencia** | Puede haber gap temporal | Movement siempre existe primero ✅ |
| **DDD puro** | Menos canónico | Más canónico ✅ |

**Score: Movement gana 7-2**

---

## 🎯 Casos de Uso Específicos

### Caso 1: Reconstruir InventoryLevel desde cero

**Con eventos de Purchase/Sale:**
```
❌ NO PUEDES

Razón:
- Los eventos Purchase/Sale no tienen toda la info
- Necesitas también los Movements
- Movements son la fuente completa
```

**Con evento de Movement:**
```
✅ SÍ PUEDES

Implementación:
1. Buscar todos los InventoryMovementCreated del ingrediente
2. Por cada movement:
   - if (isInbound()) → sumar
   - else → restar
3. Resultado = InventoryLevel actual

Código conceptual:
level = 0
for movement in movements:
  if movement.type == PURCHASE: level += movement.quantity
  if movement.type == SALE: level -= movement.quantity
  if movement.type == WASTE: level -= movement.quantity
```

### Caso 2: Agregar nuevo tipo de movimiento (ej: DONATION)

**Con eventos de Purchase/Sale:**
```
❌ PROBLEMA

Pasos necesarios:
1. Crear evento DonationRegistered
2. Modificar InventoryLevel para escuchar DonationRegistered
3. Agregar lógica en Level para manejar donación
4. Deploy de ambos contextos

→ Tocar múltiples archivos
```

**Con evento de Movement:**
```
✅ FÁCIL

Pasos necesarios:
1. Agregar DONATION a MovementType enum
2. Crear Movement con type = DONATION

→ InventoryLevel YA FUNCIONA sin cambios
→ Solo verifica si isInbound() o isOutbound()
```

### Caso 3: Auditoría / Reportes

**Pregunta:** ¿Cuánto stock de Pollo había el 1 de enero?

**Con eventos de Purchase/Sale:**
```
⚠️ COMPLEJO

Necesitas:
1. Buscar todos los PurchaseRegistered hasta el 1 de enero
2. Buscar todos los SaleCompleted hasta el 1 de enero
3. Buscar todos los WasteRegistered hasta el 1 de enero
4. Sumar y restar manualmente

→ Múltiples queries, lógica duplicada
```

**Con evento de Movement:**
```
✅ SIMPLE

Query única:
SELECT SUM(
  CASE
    WHEN type IN ('PURCHASE') THEN quantity
    WHEN type IN ('SALE', 'WASTE') THEN -quantity
  END
)
FROM inventory_movements
WHERE ingredient_id = 'pollo'
  AND created_at <= '2025-01-01'

→ Una sola query, Movement es la verdad
```

---

## 🏆 Respuesta Final y Recomendación

### **RESPUESTA CORRECTA: InventoryLevel escucha `InventoryMovementCreated`**

**Razones:**

### 1. **Movement es la fuente de verdad absoluta**
```
Movements = Event Stream (inmutable)
Level = Projection (derivado)

Analogía bancaria:
- Transacciones = Movements
- Saldo actual = Level
```

### 2. **Separación de concerns correcta**
```
Batch Context:
  - Responsabilidad: Manejar lotes físicos
  - Emite: InventoryBatchCreated

Movement Context:
  - Responsabilidad: Registro inmutable de cambios
  - Emite: InventoryMovementCreated
  - ES LA FUENTE DE VERDAD ✅

Level Context:
  - Responsabilidad: Vista del stock actual
  - Escucha: InventoryMovementCreated ✅
  - ES UNA PROYECCIÓN
```

### 3. **Extensibilidad sin tocar código**
```
Hoy: PURCHASE, SALE, WASTE
Mañana: DONATION, RETURN, LOSS
Futuro: EXPIRED, THEFT, CORRECTION

Level NO cambia → Solo lee movement.isInbound()
```

### 4. **Event Sourcing ready**
```
DELETE FROM inventory_levels;

Rebuild:
  FOR EACH movement IN movements:
    level.apply(movement)

→ Level se reconstruye perfectamente
```

### 5. **DDD canónico**
```
Vaughn Vernon recomienda:
"Aggregates emit events, projections listen to events"

Movement = Aggregate (emite)
Level = Projection (escucha)
```

---

## 📋 Flujo Recomendado Completo

```
1. USER: Registra compra de 50kg Pollo

2. RegisterPurchase.run():
   ├─ batch = Batch.create(...)
   ├─ batch.record(InventoryBatchCreated)
   ├─ await batchRepo.save(batch)
   └─ await eventBus.publish(batch.pullDomainEvents())

3. OnInventoryBatchCreated:
   ├─ movement = Movement.create(type: PURCHASE, ...)
   ├─ movement.record(InventoryMovementCreated)  ← KEY EVENT
   ├─ await movementRepo.save(movement)
   └─ await eventBus.publish(movement.pullDomainEvents())

4. OnInventoryMovementCreated:  ← Este es el subscriber que actualiza Level
   ├─ level = await levelRepo.findByIngredient(movement.ingredientId)
   ├─ if (!level): level = InventoryLevel.create(...)
   ├─ if (movement.isInbound()):
   │     level.increase(movement.quantity)
   │   else:
   │     level.decrease(movement.quantity)
   ├─ level.checkStockAlerts()
   ├─ await levelRepo.save(level)
   └─ await eventBus.publish(level.pullDomainEvents())
```

**Beneficios de este flujo:**
- ✅ Movement = única fuente de verdad
- ✅ Level = proyección 100% derivada
- ✅ Puedes reconstruir Level desde Movements
- ✅ Agregar nuevo tipo de movimiento → cero cambios en Level
- ✅ Audit trail completo en Movements

---

## ⚠️ Consideración Importante: Orden de Eventos

**Crítico:** Level DEBE actualizarse DESPUÉS de Movement

```
✅ CORRECTO:
Movement creado y guardado → Level actualizado

❌ INCORRECTO:
Level actualizado → Movement creado
(Si falla Movement, Level está mal)
```

**Garantía con eventos:**
```
OnInventoryMovementCreated solo se dispara SI:
- Movement fue creado exitosamente
- Movement fue guardado en DB
- Transacción fue committed

→ Level siempre es consistente con Movements
```

---

## 🎯 Conclusión Final

**La respuesta correcta es:**

✅ **InventoryLevel escucha `InventoryMovementCreated`**

**NO:**

❌ ~~InventoryLevel escucha `PurchaseRegistered`~~

**Razón fundamental:**

> **InventoryMovement es el agregado que representa el HECHO INMUTABLE del cambio de inventario. InventoryLevel es solo una PROYECCIÓN (vista materializada) de todos los movimientos. La fuente de verdad DEBE ser Movement, no la acción que lo causó.**

**Analogía perfecta:**

```
Banco:
  - Transacciones = InventoryMovement (la verdad)
  - Saldo = InventoryLevel (proyección de transacciones)

Nadie reconstruye el saldo desde "DepositRequested"
Se reconstruye desde las TRANSACCIONES
```

---

## 🏗️ Arquitectura Final

**Tu arquitectura debe ser:**

```
Purchase/Sale/Waste → Movement → Level
     (Intención)      (Verdad)   (Estado)
```

**Diagrama de flujo:**

```
┌─────────────────────┐
│  RegisterPurchase   │
│  (Use Case)         │
└──────────┬──────────┘
           │
           ↓ creates
┌─────────────────────┐
│  InventoryBatch     │
│  (Aggregate)        │
└──────────┬──────────┘
           │
           ↓ emits
┌─────────────────────────────┐
│  InventoryBatchCreated      │
│  (Domain Event)             │
└──────────┬──────────────────┘
           │
           ↓ triggers
┌─────────────────────────────┐
│  OnInventoryBatchCreated    │
│  (Subscriber)               │
└──────────┬──────────────────┘
           │
           ↓ creates
┌─────────────────────┐
│  InventoryMovement  │ ← SOURCE OF TRUTH
│  (Aggregate)        │
└──────────┬──────────┘
           │
           ↓ emits
┌─────────────────────────────┐
│  InventoryMovementCreated   │ ← KEY EVENT
│  (Domain Event)             │
└──────────┬──────────────────┘
           │
           ↓ triggers
┌─────────────────────────────┐
│  OnInventoryMovementCreated │
│  (Subscriber)               │
└──────────┬──────────────────┘
           │
           ↓ updates
┌─────────────────────┐
│  InventoryLevel     │ ← PROJECTION
│  (Aggregate)        │
└─────────────────────┘
```

---

**Última actualización:** 2025-11-05
**Versión:** 1.0
**Decisión:** InventoryLevel escucha `InventoryMovementCreated` ✅
