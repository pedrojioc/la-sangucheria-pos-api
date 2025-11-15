# 📦 Flujos de Inventario - La Sanguchería POS

**Fecha:** 2025-11-05
**Objetivo:** Documentar todos los flujos de negocio que afectan el inventario

---

## 🎯 Flujos Principales que Modifican Inventario

### 1. **COMPRA DE INGREDIENTES (Purchase)**

**Trigger:** El restaurante compra ingredientes a un proveedor

**Actores:**
- Gerente / Encargado de compras
- Sistema POS
- Proveedor (externo)

**Flujo:**
```
1. Encargado registra una nueva compra en el sistema
   - Ingrediente comprado (ej: Pollo)
   - Cantidad recibida (ej: 50 kg)
   - Unidad (ej: kilogramos)
   - Costo unitario (ej: $5.00/kg)
   - Proveedor
   - Fecha de compra
   - Fecha de vencimiento del lote

2. Sistema crea un BATCH (lote)
   - ID único del lote
   - Cantidad inicial = 50 kg
   - Cantidad restante = 50 kg
   - Fecha de vencimiento
   - Costo unitario = $5.00/kg

3. Sistema registra un MOVEMENT
   - Tipo: PURCHASE
   - Ingrediente: Pollo
   - Batch: Referencia al lote creado
   - Cantidad: +50 kg
   - Costo total: $250.00
   - Fecha y hora
   - Usuario que registró

4. Sistema actualiza el INVENTORY LEVEL
   - Stock actual de Pollo: aumenta en 50 kg
   - Costo promedio FIFO: se recalcula

5. Sistema verifica alertas
   - Si el stock estaba bajo, cancela alerta LOW_STOCK
   - Si el stock volvió a nivel normal, notifica

6. Sistema emite evento de dominio
   - IngredientPurchased
   - (Otros contextos pueden reaccionar si es necesario)
```

**Resultado:**
- ✅ Nuevo batch creado
- ✅ Movement PURCHASE registrado
- ✅ Stock incrementado
- ✅ Historial de movimiento guardado
- ✅ Costo FIFO actualizado

---

### 2. **VENTA / USO DE INGREDIENTES (Sale - Recipe Usage)**

**Trigger:** Se vende un producto que consume ingredientes (ej: vender un sándwich)

**Actores:**
- Cliente
- Cajero / Mesero
- Sistema POS
- Cocina

**Flujo:**
```
1. Cliente ordena un producto (ej: "Sándwich Clásico")

2. Sistema identifica la receta del producto
   - Sándwich Clásico tiene Recipe con:
     * 150g de Pollo
     * 2 unidades de Pan
     * 50g de Lechuga
     * 30g de Tomate

3. Para cada ingrediente de la receta:

   a) Sistema aplica FIFO (First In, First Out)
      - Busca el batch más antiguo que aún tiene stock

   b) Sistema deduce del batch
      - Batch #123 (comprado hace 2 días):
        * Cantidad restante antes: 50 kg
        * Cantidad a deducir: 0.15 kg (150g)
        * Cantidad restante después: 49.85 kg

   c) Sistema registra MOVEMENT
      - Tipo: SALE
      - Ingrediente: Pollo
      - Batch: #123
      - Cantidad: -0.15 kg
      - Costo unitario: $5.00/kg (del batch)
      - Costo total: $0.75
      - Referencia: ID de la orden/venta
      - Fecha y hora

   d) Sistema actualiza INVENTORY LEVEL
      - Stock actual de Pollo: disminuye 0.15 kg

4. Sistema verifica alertas de stock
   - Si Pollo cae por debajo del stock mínimo:
     * Emite evento: LowStockDetected
     * Notifica al gerente

   - Si Pollo llega a 0:
     * Emite evento: OutOfStock
     * Bloquea productos que usen Pollo (opcional)

5. Sistema calcula el costo de la venta
   - Suma los costos FIFO de todos los ingredientes
   - Costo total de ingredientes del sándwich: $2.35
   - (Usado para calcular margen de ganancia)
```

**Resultado:**
- ✅ Stock deducido de múltiples ingredientes
- ✅ Movimientos SALE registrados (uno por ingrediente)
- ✅ Batches actualizados con FIFO
- ✅ Alertas emitidas si hay stock bajo
- ✅ Costo de la venta calculado

---

### 3. **TRANSFORMACIÓN DE INGREDIENTES (Transformation)**

**Trigger:** La cocina transforma un ingrediente crudo en uno preparado (ej: pollo crudo → pollo cocido)

**Actores:**
- Cocinero
- Sistema POS
- Cocina

**Flujo:**
```
1. Cocinero selecciona una transformación
   - Transformación: "Cocinar Pollo"
   - Ingrediente origen: Pollo Crudo (5 kg)
   - Ingrediente destino: Pollo Cocido
   - Receta de preparación

2. Sistema registra el uso del ingrediente origen

   a) Deduce 5 kg de Pollo Crudo
      - MOVEMENT tipo SALE (o TRANSFORMATION)
      - Batch más antiguo (FIFO)
      - Cantidad: -5 kg
      - Costo: según batch

   b) Actualiza INVENTORY LEVEL de Pollo Crudo
      - Stock disminuye en 5 kg

3. Sistema calcula el rendimiento (yield)
   - Receta dice: 5 kg crudo → 3.5 kg cocido (70% rendimiento)
   - Si el rendimiento real es muy diferente:
     * Emite evento: AbnormalWasteDetected
     * Alerta al gerente (posible problema en cocina)

4. Sistema registra la entrada del ingrediente destino

   a) Crea nuevo BATCH de Pollo Cocido
      - Cantidad inicial: 3.5 kg
      - Cantidad restante: 3.5 kg
      - Costo unitario: (costo del pollo crudo × 5 kg) / 3.5 kg
        * Si pollo crudo costó $5/kg: ($25 total) / 3.5 kg = $7.14/kg
      - Fecha de preparación
      - Fecha de vencimiento (menor que el original)

   b) MOVEMENT tipo PURCHASE para Pollo Cocido
      - Cantidad: +3.5 kg
      - Referencia: ID de transformación

   c) Actualiza INVENTORY LEVEL de Pollo Cocido
      - Stock aumenta en 3.5 kg

5. Sistema registra la merma (waste)
   - Diferencia: 5 kg - 3.5 kg = 1.5 kg de pérdida esperada
   - Si la pérdida es mayor (ej: 2.5 kg):
     * MOVEMENT tipo WASTE
     * Alerta de rendimiento bajo

6. Sistema emite evento de dominio
   - IngredientTransformed
   - AbnormalWasteDetected (si aplica)
```

**Resultado:**
- ✅ Ingrediente origen deducido
- ✅ Ingrediente destino agregado con nuevo batch
- ✅ Costo transferido y recalculado
- ✅ Merma registrada
- ✅ Alertas de rendimiento anormal (si aplica)

---

### 4. **AJUSTE MANUAL DE INVENTARIO (Adjustment)**

**Trigger:** El encargado detecta una diferencia entre el inventario físico y el sistema

**Actores:**
- Gerente / Encargado
- Sistema POS

**Flujo:**
```
1. Gerente hace conteo físico de inventario
   - Sistema dice: 10 kg de Pollo
   - Conteo físico: 8.5 kg
   - Diferencia: -1.5 kg (faltante)

2. Gerente registra ajuste en el sistema
   - Ingrediente: Pollo
   - Cantidad ajustada: -1.5 kg
   - Razón: "Merma no registrada / Inventario físico"
   - Observaciones: "Encontrado en mal estado"

3. Sistema deduce del batch más antiguo (FIFO)
   - Batch #123:
     * Cantidad restante antes: 10 kg
     * Ajuste: -1.5 kg
     * Cantidad restante después: 8.5 kg

4. Sistema registra MOVEMENT
   - Tipo: ADJUSTMENT
   - Ingrediente: Pollo
   - Batch: #123
   - Cantidad: -1.5 kg
   - Razón: "Merma no registrada"
   - Usuario: ID del gerente
   - Fecha y hora

5. Sistema actualiza INVENTORY LEVEL
   - Stock ajustado a 8.5 kg (coincide con físico)

6. Sistema puede generar reporte
   - Diferencias de inventario
   - Para auditoría
```

**Resultado:**
- ✅ Inventario ajustado a realidad física
- ✅ Movement ADJUSTMENT registrado
- ✅ Historial de ajustes para auditoría
- ✅ Stock sincronizado

---

### 5. **MERMA / DESPERDICIO (Waste)**

**Trigger:** Se detecta ingrediente en mal estado, vencido o desperdiciado

**Actores:**
- Cocinero / Gerente
- Sistema POS

**Flujo:**
```
1. Empleado detecta ingrediente en mal estado
   - 2 kg de Pollo vencido
   - Batch #120 (comprado hace 10 días)

2. Empleado registra merma en el sistema
   - Ingrediente: Pollo
   - Cantidad desperdiciada: 2 kg
   - Razón: "Vencido" / "Mal estado" / "Accidente en cocina"
   - Batch (si se conoce): #120

3. Sistema deduce del batch específico (o FIFO)
   - Batch #120:
     * Cantidad restante antes: 5 kg
     * Merma: -2 kg
     * Cantidad restante después: 3 kg

4. Sistema registra MOVEMENT
   - Tipo: WASTE
   - Ingrediente: Pollo
   - Batch: #120
   - Cantidad: -2 kg
   - Costo: $5/kg × 2 kg = $10 (pérdida)
   - Razón: "Vencido"
   - Usuario: ID del empleado
   - Fecha y hora

5. Sistema actualiza INVENTORY LEVEL
   - Stock disminuye en 2 kg

6. Sistema genera métricas de desperdicio
   - % de merma por ingrediente
   - Costo total de desperdicio (para reportes)
   - Si la merma es muy alta:
     * Alerta al gerente
     * Sugiere revisar rotación de inventario

7. Sistema puede emitir evento
   - HighWasteDetected (si excede umbral)
```

**Resultado:**
- ✅ Merma registrada
- ✅ Stock actualizado
- ✅ Costo de pérdida calculado
- ✅ Métricas de desperdicio actualizadas
- ✅ Alertas de merma alta (si aplica)

---

### 6. **TRANSFERENCIA ENTRE UBICACIONES (Transfer)**

**Trigger:** Mover ingrediente de una ubicación a otra (ej: almacén principal → cocina)

**Actores:**
- Encargado de almacén
- Sistema POS

**Flujo:**
```
1. Encargado solicita transferencia
   - Ingrediente: Harina
   - Cantidad: 10 kg
   - Desde: Almacén Principal
   - Hacia: Cocina

2. Sistema registra SALIDA del origen
   - MOVEMENT tipo TRANSFER (OUT)
   - Ubicación: Almacén Principal
   - Ingrediente: Harina
   - Batch: #456
   - Cantidad: -10 kg

3. Sistema registra ENTRADA en destino
   - MOVEMENT tipo TRANSFER (IN)
   - Ubicación: Cocina
   - Ingrediente: Harina
   - Batch: #456 (mismo lote)
   - Cantidad: +10 kg

4. Sistema actualiza INVENTORY LEVELS
   - Nivel en Almacén Principal: -10 kg
   - Nivel en Cocina: +10 kg
   - Nivel TOTAL del restaurante: sin cambio (neutral)

5. Sistema mantiene trazabilidad del batch
   - El batch #456 ahora está en Cocina
   - Fecha de vencimiento se mantiene
   - Costo unitario se mantiene
```

**Resultado:**
- ✅ Stock transferido entre ubicaciones
- ✅ Dos movimientos TRANSFER registrados
- ✅ Stock total sin cambio
- ✅ Trazabilidad de ubicación del batch

---

## 📊 Eventos de Dominio Emitidos

### Eventos que MODIFICAN inventario:

1. **IngredientPurchased**
   - Cuando: Se registra una compra
   - Afecta: Inventory Context
   - Escuchan: Reportes, Contabilidad

2. **RecipeUsed** (desde Kitchen Context)
   - Cuando: Se vende un producto con receta
   - Afecta: Inventory Context
   - Escuchan: Inventory (para deducir ingredientes)

3. **IngredientTransformed**
   - Cuando: Se transforma un ingrediente
   - Afecta: Inventory Context
   - Escuchan: Reportes de producción

4. **InventoryAdjusted**
   - Cuando: Se hace ajuste manual
   - Afecta: Inventory Context
   - Escuchan: Auditoría, Reportes

5. **WasteRegistered**
   - Cuando: Se registra merma
   - Afecta: Inventory Context
   - Escuchan: Reportes de pérdidas, Contabilidad

### Eventos de ALERTA (no modifican, solo notifican):

6. **LowStockDetected**
   - Cuando: Stock cae por debajo del mínimo
   - Afecta: Notificaciones
   - Escuchan: Compras (para generar orden), Notificaciones

7. **OutOfStock**
   - Cuando: Stock llega a 0
   - Afecta: Menu Context (bloquear productos)
   - Escuchan: Menu, Notificaciones, Compras

8. **AbnormalWasteDetected**
   - Cuando: Rendimiento de transformación muy bajo
   - Afecta: Alertas
   - Escuchan: Gerencia, Reportes

9. **HighWasteDetected**
   - Cuando: Merma excede umbral normal
   - Afecta: Alertas
   - Escuchan: Gerencia, Auditoría

---

## 🔄 Interacciones Entre Contextos

```
┌─────────────────────────────────────────────────────────────────┐
│                        MENU CONTEXT                              │
│                                                                  │
│  Cliente ordena "Sándwich Clásico"                              │
│  ↓                                                               │
│  Sistema identifica Product.recipeId                            │
│  ↓                                                               │
│  Emite evento: ProductSold                                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ↓ (Domain Event)
┌─────────────────────────────────────────────────────────────────┐
│                      KITCHEN CONTEXT                             │
│                                                                  │
│  Subscriber escucha: ProductSold                                │
│  ↓                                                               │
│  Busca Recipe asociada al Product                               │
│  ↓                                                               │
│  Recipe tiene lista de ingredientes:                            │
│    - 150g Pollo                                                 │
│    - 2 unidades Pan                                             │
│    - 50g Lechuga                                                │
│  ↓                                                               │
│  Emite evento: RecipeUsed(ingredientes)                        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ↓ (Domain Event)
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY CONTEXT                             │
│                                                                  │
│  Subscriber escucha: RecipeUsed                                 │
│  ↓                                                               │
│  Para cada ingrediente:                                         │
│    1. Buscar batch más antiguo (FIFO)                          │
│    2. Deducir cantidad del batch                               │
│    3. Registrar MOVEMENT tipo SALE                             │
│    4. Actualizar INVENTORY LEVEL                               │
│  ↓                                                               │
│  Verificar si stock < mínimo                                    │
│  ↓                                                               │
│  SI stock bajo:                                                 │
│    Emite evento: LowStockDetected                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ↓ (Domain Event)
┌─────────────────────────────────────────────────────────────────┐
│                  PURCHASES CONTEXT (futuro)                      │
│                                                                  │
│  Subscriber escucha: LowStockDetected                           │
│  ↓                                                               │
│  Genera sugerencia de orden de compra                           │
│  ↓                                                               │
│  Notifica al gerente                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Cálculos Importantes

### 1. **Costo FIFO (First In, First Out)**

```
Cuando se deduce stock, el costo se toma del batch más antiguo:

Ejemplo:
- Batch #1: 10 kg a $5/kg (comprado hace 5 días)
- Batch #2: 15 kg a $6/kg (comprado hace 2 días)

Si se venden 12 kg:
1. Deducir 10 kg del Batch #1 → Costo: $50
2. Deducir 2 kg del Batch #2 → Costo: $12
3. Costo total de la venta: $62
4. Costo promedio: $62 / 12 kg = $5.17/kg
```

### 2. **Stock Actual vs Stock Disponible**

```
Stock Actual = Suma de quantity de todos los batches
Stock Disponible = Stock Actual - Stock Reservado (órdenes pendientes)
Stock Mínimo = Umbral configurado por ingrediente
Stock Máximo = Capacidad de almacenamiento
```

### 3. **Valorización de Inventario**

```
Valor Total del Inventario = Σ (batch.remainingQuantity × batch.unitCost)

Para cada ingrediente:
  Valor = Σ (batches.remainingQuantity × batches.unitCost)
```

### 4. **Métricas de Desperdicio**

```
% Merma = (Cantidad Desperdiciada / Cantidad Comprada) × 100

Por período:
  Total Comprado: 100 kg
  Total Desperdiciado: 5 kg
  % Merma: 5%

Si % Merma > 10%: Alerta de merma alta
```

---

## 🎯 Reglas de Negocio Críticas

### 1. **FIFO Obligatorio**
- Siempre deducir del batch más antiguo primero
- Previene vencimientos
- Refleja realidad física del restaurante

### 2. **Inmutabilidad de Movements**
- Los movimientos NUNCA se modifican
- Solo se crean movimientos nuevos (ej: ajuste correctivo)
- Garantiza trazabilidad completa

### 3. **Batch con Vencimiento**
- Todo batch de perecedero DEBE tener fecha de vencimiento
- Sistema debe alertar batches próximos a vencer
- Sugerir usar batches antiguos primero

### 4. **Consistency Eventual**
- Los eventos entre contextos son asíncronos
- InventoryLevel puede no actualizarse instantáneamente
- Pero SIEMPRE se actualiza (eventual consistency)

### 5. **Negative Stock Prevention**
- NO se puede vender si no hay stock
- Verificar stock ANTES de confirmar orden
- Bloquear productos si ingrediente está en 0

### 6. **Audit Trail Completo**
- Cada movimiento tiene:
  - Usuario que lo registró
  - Fecha y hora exacta
  - Razón del movimiento
  - Referencia (orden, transformación, etc.)

---

## 🔐 Restricciones de Seguridad

### Permisos por Rol:

**Gerente:**
- ✅ Registrar compras
- ✅ Ajustes manuales
- ✅ Ver reportes de merma
- ✅ Configurar stock mínimo/máximo

**Cocinero:**
- ✅ Registrar transformaciones
- ✅ Registrar merma
- ❌ No puede ajustar inventario manualmente
- ❌ No puede ver costos

**Cajero:**
- ✅ Vender productos (deduce inventario automático)
- ❌ No puede ver inventario directamente
- ❌ No puede hacer ajustes

**Encargado de Almacén:**
- ✅ Registrar compras
- ✅ Transferencias entre ubicaciones
- ❌ No puede ver costos detallados

---

**Última actualización:** 2025-11-05
**Versión:** 1.0
