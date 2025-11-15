# 📦 Análisis: Órdenes de Compra (Purchase Orders)

**Fecha:** 2025-11-05
**Problema Identificado:** El proyecto NO tiene un módulo de Purchase Orders
**Estado Actual:** Se salta directamente a `RegisterPurchase` (registro de recepción)

---

## 🎯 El Problema

### Flujo Real del Negocio (Mundo Real):

```
1. Gerente detecta stock bajo de Pollo
   ↓
2. Gerente CREA ORDEN DE COMPRA
   - Ingrediente: Pollo
   - Cantidad solicitada: 50 kg
   - Proveedor: Avícola Los Andes
   - Precio estimado: $5/kg
   - Estado: PENDIENTE
   ↓
3. Gerente APRUEBA orden de compra
   - Estado: APROBADA
   ↓
4. Sistema envía orden al proveedor (email/PDF)
   ↓
5. Proveedor entrega mercancía
   ↓
6. Encargado de almacén RECIBE y VERIFICA
   - Cantidad recibida real: 48 kg (faltan 2 kg)
   - Calidad: OK
   - Fecha vencimiento: 2025-12-01
   ↓
7. Sistema REGISTRA RECEPCIÓN (RegisterPurchase)
   - Crea Batch
   - Crea Movement
   - Actualiza Level
   ↓
8. Sistema CIERRA orden de compra
   - Estado: COMPLETADA (o PARCIALMENTE_COMPLETADA)
   - Diferencia registrada: -2 kg
```

### Flujo Actual del Proyecto (Incompleto):

```
❌ FALTA: Crear Orden de Compra
❌ FALTA: Aprobar Orden
❌ FALTA: Enviar al Proveedor
❌ FALTA: Tracking de órdenes pendientes
   ↓
✅ EXISTE: RegisterPurchase (paso 7)
   - Registra recepción directamente
   - Sin orden de compra previa
```

**Consecuencias:**
- ❌ No hay trazabilidad de lo que se pidió vs lo que llegó
- ❌ No hay proceso de aprobación
- ❌ No hay histórico de órdenes a proveedores
- ❌ No hay alertas de órdenes pendientes
- ❌ No hay comparación precio estimado vs precio real

---

## 🏗️ Análisis de Bounded Contexts

### ¿Dónde debe vivir Purchase Orders?

**Opciones:**

### **Opción 1: Dentro de Inventory Context** ❌

```
src/contexts/inventory/
├── ingredient/
├── stock-level/
├── batch/
└── purchase-order/  ← Aquí
```

**Razón para NO hacerlo:**
- Purchase Order es un concepto de **Procurement** (Adquisiciones)
- Inventory es sobre **gestionar stock existente**
- Son responsabilidades diferentes
- Violates Single Responsibility del contexto

### **Opción 2: Nuevo Bounded Context: Procurement** ✅ RECOMENDADO

```
src/contexts/procurement/
├── purchase-order/
│   ├── domain/
│   │   ├── purchase-order.ts          # Aggregate Root
│   │   ├── purchase-order-id.ts
│   │   ├── purchase-order-status.ts   # DRAFT, PENDING, APPROVED, etc.
│   │   ├── purchase-order-item.ts     # Entity
│   │   ├── events/
│   │   │   ├── purchase-order-created.event.ts
│   │   │   ├── purchase-order-approved.event.ts
│   │   │   ├── purchase-order-sent.event.ts
│   │   │   └── purchase-order-received.event.ts
│   │   └── repositories/
│   │       └── purchase-order.repository.ts
│   │
│   ├── application/
│   │   ├── create/
│   │   ├── approve/
│   │   ├── send-to-supplier/
│   │   ├── register-reception/
│   │   └── close-order/
│   │
│   ├── infrastructure/
│   │   └── persistence/
│   │
│   └── presentation/
│       └── http/
│
└── supplier/
    ├── domain/
    │   ├── supplier.ts                # Aggregate Root
    │   ├── supplier-id.ts
    │   ├── supplier-contact.ts
    │   └── repositories/
    │
    ├── application/
    └── infrastructure/
```

**Razones para Bounded Context separado:**

1. **Lenguaje Ubicuo diferente:**
   - Procurement: "Orden", "Proveedor", "Aprobación", "Presupuesto"
   - Inventory: "Stock", "Lote", "Movimiento", "Nivel"

2. **Reglas de negocio diferentes:**
   - Procurement: Aprobaciones, cotizaciones, negociación
   - Inventory: FIFO, vencimientos, alertas de stock

3. **Actores diferentes:**
   - Procurement: Gerente de compras, Proveedor
   - Inventory: Encargado de almacén, Cocinero

4. **Ciclo de vida diferente:**
   - Purchase Order: DRAFT → APPROVED → SENT → RECEIVED → CLOSED
   - Inventory Batch: CREATED → ACTIVE → DEPLETED

5. **Escalabilidad futura:**
   - Procurement puede crecer: cotizaciones, contratos, etc.
   - Inventory se mantiene enfocado en stock

### **Opción 3: Módulo dentro de Inventory** ⚠️ (Solo si muy simple)

```
src/contexts/inventory/
└── purchase-request/  ← Versión simplificada
```

**Cuándo usar:**
- Si NO necesitas aprobaciones complejas
- Si NO manejas múltiples proveedores
- Si es solo para "recordar que pedí esto"
- POS muy pequeño (1 local)

---

## 📋 Comparación de Enfoques

| Aspecto | Procurement Context | Módulo en Inventory | Sin Purchase Order (actual) |
|---------|--------------------|--------------------|----------------------------|
| **Trazabilidad** | ✅ Completa | ⚠️ Básica | ❌ Ninguna |
| **Aprobaciones** | ✅ Workflow completo | ⚠️ Simple | ❌ No existe |
| **Proveedores** | ✅ Múltiples proveedores | ⚠️ Limitado | ❌ No gestionado |
| **Histórico** | ✅ Completo | ⚠️ Básico | ❌ Solo recepciones |
| **Comparación precio** | ✅ Estimado vs Real | ⚠️ Limitado | ❌ No |
| **Alertas** | ✅ Órdenes pendientes | ⚠️ Básicas | ❌ No |
| **Escalabilidad** | ✅ Alta | ⚠️ Media | ❌ Baja |
| **Complejidad** | ⚠️ Mayor | ✅ Media | ✅ Mínima |
| **Separación concerns** | ✅ Clara | ⚠️ Mezclada | ✅ N/A |

---

## 🎯 Diseño del Aggregate: PurchaseOrder

### Domain Model (conceptual):

```typescript
// Aggregate Root
PurchaseOrder:
  - id: PurchaseOrderId
  - orderNumber: string                    // PO-2025-001
  - supplierId: SupplierId
  - items: PurchaseOrderItem[]             // Collection de items
  - status: PurchaseOrderStatus            // DRAFT, PENDING, APPROVED...
  - requestedBy: UserId
  - approvedBy: UserId | null
  - totalAmount: Money
  - requestedDate: Date
  - expectedDeliveryDate: Date
  - actualDeliveryDate: Date | null
  - notes: string | null

// Entity (dentro del aggregate)
PurchaseOrderItem:
  - ingredientId: IngredientId
  - quantityRequested: Quantity
  - quantityReceived: Quantity | null      // Null hasta recepción
  - unitCost: Money
  - totalCost: Money
  - notes: string | null

// Value Object
PurchaseOrderStatus:
  - DRAFT          (borrador, editando)
  - PENDING        (enviada, esperando aprobación)
  - APPROVED       (aprobada, lista para enviar)
  - SENT           (enviada al proveedor)
  - PARTIALLY_RECEIVED  (recibida parcialmente)
  - RECEIVED       (recibida completamente)
  - CLOSED         (cerrada/completada)
  - CANCELLED      (cancelada)
```

### Estados del Purchase Order:

```
DRAFT
  ↓ (submit)
PENDING
  ↓ (approve)
APPROVED
  ↓ (sendToSupplier)
SENT
  ↓ (receivePartial)
PARTIALLY_RECEIVED
  ↓ (receiveComplete)
RECEIVED
  ↓ (close)
CLOSED
```

---

## 🔄 Flujo Completo con Purchase Orders

### Flujo Ideal (Con Procurement Context):

```
1. CREAR ORDEN DE COMPRA
   ────────────────────────────────────────────────────────
   Actor: Gerente
   Trigger: Stock bajo de Pollo (evento LowStockDetected)

   Use Case: CreatePurchaseOrder
   ├─ order = PurchaseOrder.create(...)
   ├─ order.addItem(Pollo, 50kg, estimatedPrice: $5/kg)
   ├─ order.record(PurchaseOrderCreated)
   └─ await orderRepo.save(order)

   Estado: DRAFT
   ────────────────────────────────────────────────────────

2. APROBAR ORDEN
   ────────────────────────────────────────────────────────
   Actor: Gerente

   Use Case: ApprovePurchaseOrder
   ├─ order = await orderRepo.find(orderId)
   ├─ order.approve(userId)
   ├─ order.record(PurchaseOrderApproved)
   └─ await orderRepo.save(order)

   Estado: APPROVED
   ────────────────────────────────────────────────────────

3. ENVIAR AL PROVEEDOR
   ────────────────────────────────────────────────────────
   Actor: Sistema (automático) o Gerente

   Use Case: SendPurchaseOrderToSupplier
   ├─ order = await orderRepo.find(orderId)
   ├─ supplier = await supplierRepo.find(order.supplierId)
   ├─ pdf = generatePurchaseOrderPDF(order)
   ├─ await emailService.send(supplier.email, pdf)
   ├─ order.markAsSent()
   ├─ order.record(PurchaseOrderSent)
   └─ await orderRepo.save(order)

   Estado: SENT
   ────────────────────────────────────────────────────────

4. RECIBIR MERCANCÍA (RegisterReception)
   ────────────────────────────────────────────────────────
   Actor: Encargado de almacén
   Trigger: Proveedor entrega mercancía

   Use Case: RegisterPurchaseOrderReception
   ├─ order = await orderRepo.find(orderId)
   ├─ order.registerReception(item, actualQuantity: 48kg)
   │   └─ item.quantityReceived = 48kg
   │   └─ item.variance = -2kg  (50 - 48)
   ├─ order.record(PurchaseOrderItemReceived)
   ├─ await orderRepo.save(order)
   │
   └─ Emite evento: PurchaseOrderItemReceived

   Estado: RECEIVED (o PARTIALLY_RECEIVED)
   ────────────────────────────────────────────────────────

5. INVENTORY CONTEXT REACCIONA
   ────────────────────────────────────────────────────────
   Subscriber: OnPurchaseOrderItemReceived

   ├─ Escucha: PurchaseOrderItemReceived
   ├─ Ejecuta: RegisterPurchase (el use case actual)
   │   ├─ Crear InventoryBatch (48kg, no 50kg)
   │   ├─ Emite: InventoryBatchCreated
   │   └─ (resto del flujo conocido...)
   │
   └─ Inventario actualizado con cantidad REAL recibida
   ────────────────────────────────────────────────────────

6. CERRAR ORDEN
   ────────────────────────────────────────────────────────
   Actor: Sistema (automático) o Gerente

   Use Case: ClosePurchaseOrder
   ├─ order = await orderRepo.find(orderId)
   ├─ order.close()
   ├─ order.record(PurchaseOrderClosed)
   └─ await orderRepo.save(order)

   Estado: CLOSED
   ────────────────────────────────────────────────────────
```

---

## 🔔 Eventos de Dominio

### Procurement Context emite:

```typescript
1. PurchaseOrderCreated
   - When: Se crea orden
   - Data: orderId, supplierId, items[], totalAmount
   - Listeners: Notificaciones

2. PurchaseOrderApproved
   - When: Se aprueba orden
   - Data: orderId, approvedBy, approvalDate
   - Listeners: Puede auto-enviar al proveedor

3. PurchaseOrderSent
   - When: Se envía al proveedor
   - Data: orderId, supplierId, sentDate
   - Listeners: Tracking, notificaciones

4. PurchaseOrderItemReceived
   - When: Se recibe un item (total o parcial)
   - Data: orderId, itemId, ingredientId, quantityReceived, unitCost
   - Listeners: Inventory Context (RegisterPurchase) ← KEY!

5. PurchaseOrderClosed
   - When: Se cierra orden (completada)
   - Data: orderId, closedDate, totalReceived, variances
   - Listeners: Reportes, contabilidad
```

### Inventory Context escucha:

```typescript
OnPurchaseOrderItemReceived:
  - Triggered by: PurchaseOrderItemReceived
  - Action:
    1. Extraer datos del evento (ingredientId, quantity, cost, etc.)
    2. Llamar a RegisterPurchase use case
    3. Crear InventoryBatch con datos reales
```

---

## 📊 Context Map Actualizado

```
┌─────────────────────────────────────────────────────────────┐
│                      Shared Kernel                           │
│  Unit, Money, Quantity                                      │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │                     │                     │
┌───────▼────────┐   ┌────────▼───────┐   ┌────────▼────────┐
│  Procurement   │   │   Inventory    │   │     Kitchen     │
│   Context      │   │    Context     │   │    Context      │
│                │   │                │   │                 │
│ - PurchaseOrder│   │ - Ingredient   │   │ - Recipe        │
│ - Supplier     │   │ - Batch        │   │ - Transform     │
│                │   │ - Movement     │   │                 │
│                │   │ - Level        │   │                 │
└──────┬─────────┘   └────────▲───────┘   └─────────────────┘
       │                      │
       │  PurchaseOrderItem   │
       │      Received        │
       └──────────────────────┘
            (Domain Event)
```

**Relación clave:**
- **Procurement → Inventory**: Cuando se recibe mercancía
- **Inventory → Procurement**: Cuando stock bajo (auto-crear orden)

---

## 💡 Beneficios de Tener Purchase Orders

### 1. **Trazabilidad Completa**
```
Query: "¿Quién aprobó la compra de Pollo del 15 de enero?"
Response: Gerente Juan Pérez, aprobado el 15/01/2025 10:30 AM
          Orden: PO-2025-001
```

### 2. **Control de Varianzas**
```
Orden solicitada: 50 kg a $5/kg = $250
Recibido real:    48 kg a $5.20/kg = $249.60

Varianzas:
- Cantidad: -2 kg (-4%)
- Precio: +$0.20/kg (+4%)
- Total: -$0.40 (-0.16%)

→ Sistema alerta diferencias significativas
```

### 3. **Flujo de Aprobaciones**
```
Solo órdenes > $1000 requieren aprobación del Gerente General
Órdenes < $1000 auto-aprobadas por Supervisor
```

### 4. **Histórico de Proveedores**
```
Proveedor: Avícola Los Andes
Órdenes completadas: 45
Promedio tiempo entrega: 2.3 días
Varianzas promedio: -1.2%
Calificación: 4.5/5
```

### 5. **Presupuesto y Proyecciones**
```
Órdenes pendientes (SENT): $5,230
Próximas entregas (esta semana): $2,150
Proyección mes: $18,500
```

---

## 🎯 Recomendación Final

### **Para La Sanguchería POS:**

**Opción Recomendada: Crear Procurement Context**

**Razones:**

1. **Escalabilidad:**
   - Si tienes 1 local hoy, mañana tendrás 5
   - Múltiples locales = múltiples órdenes
   - Necesitarás control centralizado

2. **Control financiero:**
   - POS de restaurante = costos de ingredientes son 30-40% de ventas
   - Controlar compras = controlar rentabilidad
   - Purchase Orders = trazabilidad de gastos

3. **Compliance:**
   - Auditorías requieren histórico de compras
   - ¿Quién aprobó qué?
   - ¿Cuánto se gastó?

4. **Mejor negociación:**
   - Histórico con proveedores
   - Comparar precios
   - Detectar aumentos injustificados

5. **Automatización:**
   - Stock bajo → Auto-crear orden borrador
   - Gerente solo aprueba
   - Sistema envía al proveedor

**Implementación sugerida:**

```
Fase 1 (MVP - 1 semana):
  - Purchase Order aggregate básico
  - Estados: DRAFT, APPROVED, RECEIVED, CLOSED
  - Use cases: Create, Approve, Register Reception
  - Evento: PurchaseOrderItemReceived → Inventory

Fase 2 (Completo - 2 semanas):
  - Supplier aggregate
  - Envío automático de órdenes (email/PDF)
  - Tracking de órdenes pendientes
  - Dashboard de compras

Fase 3 (Avanzado - futuro):
  - Cotizaciones (múltiples proveedores)
  - Contratos y precios pactados
  - Reportes financieros
  - Integración con contabilidad
```

---

## ⚠️ Alternativa Mínima (Si no quieres Procurement Context ahora)

Si prefieres postponer Procurement Context, al menos agrega esto:

```typescript
// En RegisterPurchase, agregar campos opcionales:

RegisterPurchase.run(
  ...,
  orderReference?: string,      // Número de orden (manual)
  expectedQuantity?: number,    // Lo que se pidió
  expectedPrice?: number        // Precio esperado
)

// Y crear una tabla simple:
purchase_references:
  - id
  - order_number
  - supplier_name
  - requested_date
  - notes
```

Pero esto es **temporal** y deberías migrar a Procurement Context cuando crezcas.

---

## 🎯 Decisión

**Respuesta a tu pregunta:**

> "En el proyecto dónde se está realizando las órdenes de compra?"

**Respuesta:** ❌ **NO EXISTEN** órdenes de compra en el proyecto actual.

**Recomendación:** ✅ **CREAR** Procurement Bounded Context con Purchase Orders

**Prioridad:** 🔴 **ALTA** - Es un gap importante en el flujo de negocio

---

**Última actualización:** 2025-11-05
**Próximo paso:** Diseñar e implementar Procurement Context
