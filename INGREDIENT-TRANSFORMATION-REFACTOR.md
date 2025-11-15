# Refactorización: Manejo Correcto de Merma en Transformaciones de Ingredientes

## 🎯 Problema Identificado

La implementación original **calculaba automáticamente** la cantidad de salida (`outputQuantity`) usando el `yieldPercentage` de la receta, cuando debería ser el **usuario quien ingrese las cantidades reales**.

### ❌ Implementación Anterior (Incorrecta)

```typescript
// Usuario ingresaba solo:
- inputQuantity: 5kg (morro crudo usado)

// Sistema calculaba automáticamente:
- outputQuantity = 5kg × 50% = 2.5kg (morro preparado) ← CALCULADO
- wasteQuantity = 5kg - 2.5kg = 2.5kg ← CALCULADO
```

**Problemas:**
- No reflejaba la realidad (a veces se obtiene más o menos)
- No permitía detectar variaciones en el rendimiento
- Costo basado en teoría, no en realidad
- Imposible detectar pérdidas anormales

## ✅ Solución Implementada

### Usuario Ingresa Cantidades Reales

```typescript
// Usuario ingresa:
- inputQuantity: 5kg (morro crudo usado)
- outputQuantity: 2.3kg (morro preparado obtenido) ← USUARIO INGRESA

// Sistema calcula:
- wasteQuantity = 5kg - 2.3kg = 2.7kg
- actualYield = (2.3 / 5) × 100 = 46%

// Sistema compara con receta:
- expectedYield = 50%
- expectedOutput = 2.5kg
- variance = ((2.3 - 2.5) / 2.5) × 100 = -8%

// Si variance > 15%, emite alerta
```

---

## 📋 Cambios Realizados

### 1. **PreparationRecipe Aggregate** (Domain)

**Archivo:** `src/modules/ingredient-transformations/domain/preparation-recipe.ts`

**Cambios:**
- ✅ Renombrado `calculateOutputQuantity()` → `calculateExpectedOutput()`
- ✅ Renombrado `calculateWaste()` → `calculateExpectedWaste()`
- ✅ Agregado `calculateYieldVariance(baseQuantity, actualOutput)` para comparar esperado vs real
- ✅ Documentación actualizada: `yieldPercentage` es **REFERENCIAL**, no para cálculos de inventario

**Métodos:**
```typescript
// Cálculos referenciales (NO usados en registro de transformación)
calculateExpectedOutput(baseQuantity: number): number
calculateExpectedWaste(baseQuantity: number): number

// Nuevo: Calcular varianza entre esperado y real
calculateYieldVariance(baseQuantity: number, actualOutput: number): number
```

---

### 2. **AbnormalWasteDetectedEvent** (Domain Event)

**Archivo:** `src/modules/ingredient-transformations/domain/events/abnormal-waste-detected.event.ts`

**Nuevo evento:**
```typescript
interface AbnormalWasteDetectedEventPayload {
  transformationId: string
  recipeId: string
  recipeName: string
  baseIngredientId: string
  outputIngredientId: string
  inputQuantity: number
  inputUnitId: string
  expectedOutput: number      // ← Lo que decía la receta
  actualOutput: number        // ← Lo que realmente se obtuvo
  outputUnitId: string
  expectedWaste: number       // ← Merma esperada
  actualWaste: number         // ← Merma real
  yieldVariancePercentage: number  // ← % de diferencia
  performedAt: Date
  performedBy: string | null
}
```

**Se dispara cuando:** `|yieldVariance| > 15%`

---

### 3. **RegisterTransformation Use Case** (Application)

**Archivo:** `src/modules/ingredient-transformations/application/register-transformation/register-transformation.ts`

**Cambios en signature:**
```typescript
// ❌ ANTES
async run(
  transformationId: string,
  recipeId: string,
  inputQuantity: number,
  inputUnitId: string,
  performedBy: string | null,
  notes: string | null
): Promise<void>

// ✅ AHORA
async run(
  transformationId: string,
  recipeId: string,
  inputQuantity: number,
  inputUnitId: string,
  outputQuantity: number,      // ← Nuevo: Usuario ingresa
  outputUnitId: string,         // ← Nuevo: Usuario ingresa
  performedBy: string | null,
  notes: string | null
): Promise<void>
```

**Lógica actualizada:**
```typescript
// 6. Calcular merma REAL (basada en cantidades del usuario)
const wasteQuantity = inputQuantity - outputQuantity

// 7. Calcular varianza de rendimiento
const yieldVariance = recipe.calculateYieldVariance(inputQuantity, outputQuantity)
const expectedOutput = recipe.calculateExpectedOutput(inputQuantity)
const expectedWaste = recipe.calculateExpectedWaste(inputQuantity)

// 8. Si varianza excede threshold (15%), emitir alerta
if (Math.abs(yieldVariance) > YIELD_VARIANCE_THRESHOLD) {
  events.push(new AbnormalWasteDetectedEvent({
    expectedOutput,
    actualOutput: outputQuantity,
    expectedWaste,
    actualWaste: wasteQuantity,
    yieldVariancePercentage: yieldVariance,
    ...
  }))
}

// 9. Publicar eventos (transformación + alerta si aplica)
await eventBus.publish(events)
```

---

### 4. **RegisterTransformationCommand** (Application)

**Archivo:** `src/modules/ingredient-transformations/application/register-transformation/register-transformation.command.ts`

**Cambios:**
```typescript
export class RegisterTransformationCommand {
  constructor(
    public readonly transformationId: string,
    public readonly recipeId: string,
    public readonly inputQuantity: number,
    public readonly inputUnitId: string,
    public readonly outputQuantity: number,  // ← Nuevo
    public readonly outputUnitId: string,    // ← Nuevo
    public readonly performedBy: string | null,
    public readonly notes: string | null
  ) {}
}
```

---

### 5. **RegisterTransformationHandler** (Application)

**Archivo:** `src/modules/ingredient-transformations/application/register-transformation/register-transformation.handler.ts`

**Cambios:**
```typescript
async execute(command: RegisterTransformationCommand): Promise<void> {
  return this.useCase.run(
    command.transformationId,
    command.recipeId,
    command.inputQuantity,
    command.inputUnitId,
    command.outputQuantity,  // ← Nuevo
    command.outputUnitId,    // ← Nuevo
    command.performedBy,
    command.notes
  )
}
```

---

### 6. **RegisterTransformationRequest** (Presentation)

**Archivo:** `src/modules/ingredient-transformations/presentation/http/dto/register-transformation.request.ts`

**Nuevo DTO:**
```typescript
export class RegisterTransformationRequest {
  @IsUUID()
  id: string

  @IsUUID()
  recipeId: string

  @IsNumber()
  @Min(0.001)
  inputQuantity: number

  @IsUUID()
  inputUnitId: string

  @IsNumber()
  @Min(0.001)
  outputQuantity: number    // ← Usuario ingresa cantidad REAL obtenida

  @IsUUID()
  outputUnitId: string

  @IsOptional()
  @IsString()
  performedBy?: string

  @IsOptional()
  @IsString()
  notes?: string
}
```

**Ejemplo de request:**
```json
{
  "id": "uuid-123",
  "recipeId": "uuid-recipe-morro",
  "inputQuantity": 5.0,
  "inputUnitId": "uuid-kg",
  "outputQuantity": 2.3,
  "outputUnitId": "uuid-kg",
  "performedBy": "chef-pedro",
  "notes": "Preparación turno mañana"
}
```

---

### 7. **IngredientTransformationController** (Presentation)

**Archivo:** `src/modules/ingredient-transformations/presentation/http/controllers/ingredient-transformation.controller.ts`

**Nuevo controller:**
```typescript
@Controller('ingredient-transformations')
export class IngredientTransformationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async register(@Body() dto: RegisterTransformationRequest): Promise<void> {
    const command = new RegisterTransformationCommand(
      dto.id,
      dto.recipeId,
      dto.inputQuantity,
      dto.inputUnitId,
      dto.outputQuantity,
      dto.outputUnitId,
      dto.performedBy ?? null,
      dto.notes ?? null
    )

    await this.commandBus.execute(command)
  }
}
```

---

### 8. **IngredientTransformationsModule**

**Archivo:** `src/modules/ingredient-transformations/ingredient-transformations.module.ts`

**Cambios:**
- ✅ Agregado `IngredientTransformationController` a `controllers`

---

## 🎯 Rol del `yieldPercentage`

### ✅ Para Qué SE USA:

1. **Referencia:** "Normalmente esperamos 50% de rendimiento"
2. **Comparación:** Comparar rendimiento esperado vs real
3. **Alertas:** Detectar variaciones anormales (> 15%)
4. **Reportes:** Análisis de eficiencia en el tiempo
5. **Presupuesto:** Estimar cuánto comprar de materia prima

### ❌ Para Qué NO SE USA:

1. ❌ **NO para calcular** `outputQuantity` en transformaciones reales
2. ❌ **NO para inventario** (se usa cantidad real)
3. ❌ **NO para costeo** (se usa cantidad real obtenida)

---

## 📊 Thresholds de Alerta

```typescript
private readonly YIELD_VARIANCE_THRESHOLD = 15  // 15%
```

**Escenarios:**

| Varianza | Estado | Ejemplo | Acción |
|----------|--------|---------|--------|
| ±0-10% | ✅ Normal | Esperado: 2.5kg, Real: 2.4kg (-4%) | Sin alerta |
| ±10-15% | ⚠️ Atención | Esperado: 2.5kg, Real: 2.2kg (-12%) | Sin alerta |
| >±15% | 🚨 Anormal | Esperado: 2.5kg, Real: 2.0kg (-20%) | **Emite `AbnormalWasteDetectedEvent`** |

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                    │
│ Usuario registra transformación:                           │
│ - 5kg morro crudo usado                                    │
│ - 2.3kg morro preparado obtenido (REAL)                   │
└─────────────────────────────────────────────────────────────┘
                         ↓ POST /ingredient-transformations
┌─────────────────────────────────────────────────────────────┐
│ CONTROLLER                                                  │
│ RegisterTransformationRequest → Command                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ USE CASE: RegisterTransformation                           │
│                                                             │
│ 1. Deduce 5kg morro crudo (FIFO)                          │
│ 2. Deduce condimentos (FIFO)                              │
│ 3. Calcula costo total: $50.50                            │
│ 4. Calcula merma REAL: 5kg - 2.3kg = 2.7kg               │
│ 5. Calcula varianza:                                       │
│    - Esperado: 2.5kg (50%)                                │
│    - Real: 2.3kg (46%)                                    │
│    - Varianza: -8%                                        │
│ 6. ✅ Varianza < 15% → No alerta                          │
│ 7. Crea batch: 2.3kg @ $21.96/kg                         │
│ 8. Registra transformación                                 │
│ 9. Publica: IngredientTransformedEvent                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ INVENTARIO ACTUALIZADO                                      │
│ - Morro Crudo: -5kg                                        │
│ - Condimentos: -X gramos                                   │
│ + Morro Preparado: +2.3kg @ $21.96/kg                    │
└─────────────────────────────────────────────────────────────┘
```

**Si varianza > 15%:**
```
6. 🚨 Varianza > 15% → Emite AbnormalWasteDetectedEvent
9. Publica: [IngredientTransformedEvent, AbnormalWasteDetectedEvent]
```

---

## 🧪 Ejemplo de Uso

### Request:

```bash
POST /ingredient-transformations
Content-Type: application/json

{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "recipeId": "recipe-morro-preparado-uuid",
  "inputQuantity": 5.0,
  "inputUnitId": "unit-kg-uuid",
  "outputQuantity": 2.3,
  "outputUnitId": "unit-kg-uuid",
  "performedBy": "chef-pedro",
  "notes": "Cocción turno mañana, morro de buena calidad"
}
```

### Response:

```
204 No Content
```

### Eventos Publicados:

**1. IngredientTransformedEvent** (Siempre)
```json
{
  "eventName": "ingredient.transformed",
  "transformationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "recipeId": "recipe-morro-preparado-uuid",
  "inputQuantity": 5.0,
  "outputQuantity": 2.3,
  "wasteQuantity": 2.7,
  "totalCost": 50.50,
  "outputUnitCost": 21.96,
  "currency": "PEN",
  "performedAt": "2025-11-02T15:30:00Z",
  "performedBy": "chef-pedro"
}
```

**2. AbnormalWasteDetectedEvent** (Si varianza > 15%)
```json
{
  "eventName": "ingredient.transformation.abnormal_waste_detected",
  "transformationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "recipeId": "recipe-morro-preparado-uuid",
  "recipeName": "Morro Preparado",
  "expectedOutput": 2.5,
  "actualOutput": 2.3,
  "expectedWaste": 2.5,
  "actualWaste": 2.7,
  "yieldVariancePercentage": -8.0,
  "performedAt": "2025-11-02T15:30:00Z",
  "performedBy": "chef-pedro"
}
```

---

## 🎉 Beneficios

✅ **Realidad:** Refleja lo que realmente sucedió
✅ **Control:** Detecta variaciones en el proceso
✅ **Costo preciso:** Basado en cantidades reales
✅ **Alertas:** Identifica pérdidas anormales
✅ **Trazabilidad:** Auditoría completa de transformaciones
✅ **Flexibilidad:** No asume rendimiento perfecto
✅ **Análisis:** Datos para mejorar procesos

---

## 📝 Notas Importantes

1. **Threshold de 15%:** Configurable en `RegisterTransformation.YIELD_VARIANCE_THRESHOLD`
2. **Eventos:** Ambos eventos se persisten en `event_store` para auditoría
3. **Costo:** El costo unitario de salida **incluye la merma** (costo total / output real)
4. **Subscribers:** Pueden crearse subscribers para reaccionar a `AbnormalWasteDetectedEvent`
5. **Frontend:** El frontend es responsable de generar el UUID del `transformationId`

---

**Fecha de Refactorización:** 2025-11-02
**Documentado por:** Claude Code
**Status:** ✅ Completado
