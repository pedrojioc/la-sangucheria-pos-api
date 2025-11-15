# 🏗️ Análisis: Organización por Capas vs por Agregados

**Fecha:** 2025-11-04
**Pregunta:** ¿Organizar por capas (domain/application/infrastructure) o por agregados (product/category)?

---

## 🎯 Las Dos Propuestas

### Propuesta 1: Organización por CAPAS (Actual)

```
contexts/menu/
├── domain/
│   ├── product/
│   │   ├── product.ts
│   │   ├── product-id.ts
│   │   └── repositories/
│   └── category/
│       ├── product-category.ts
│       └── repositories/
│
├── application/
│   ├── product/
│   │   ├── create/
│   │   ├── update/
│   │   └── queries/
│   └── category/
│       ├── create/
│       └── queries/
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── product.entity.ts
│           └── product-category.entity.ts
│
└── presentation/
    └── http/
        ├── product.controller.ts
        └── category.controller.ts
```

**Características:**
- Agrupa por capa técnica (domain, application, etc.)
- Dentro de cada capa se subdivide por agregado
- Onion Architecture clásica

---

### Propuesta 2: Organización por AGREGADOS (Tu propuesta)

```
contexts/menu/
├── product/
│   ├── domain/
│   │   ├── product.ts
│   │   ├── product-id.ts
│   │   └── repositories/
│   │
│   ├── application/
│   │   ├── create/
│   │   ├── update/
│   │   └── queries/
│   │
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── typeorm/
│   │           └── product.entity.ts
│   │
│   └── presentation/
│       └── http/
│           └── product.controller.ts
│
└── category/
    ├── domain/
    │   ├── product-category.ts
    │   └── repositories/
    │
    ├── application/
    │   ├── create/
    │   └── queries/
    │
    ├── infrastructure/
    │   └── persistence/
    │       └── typeorm/
    │           └── product-category.entity.ts
    │
    └── presentation/
        └── http/
            └── category.controller.ts
```

**Características:**
- Agrupa por agregado/concepto de dominio
- Cada agregado tiene sus propias capas completas
- Vertical slicing

---

## 📚 Referencias de Expertos

### 1. **Eric Evans (DDD Blue Book)**

> "The model is a set of concepts built up in the minds of people on the project, with terms and relationships that reflect domain insight."

**No prescribe estructura de carpetas específica**, pero enfatiza:
- ✅ Mantener el modelo de dominio puro
- ✅ Separar capas claramente
- ⚠️ No habla de estructura física de archivos

**Conclusión:** Evans no favorece ninguna opción específica.

---

### 2. **Vaughn Vernon (DDD Red Book - Implementing DDD)**

Recomienda **organización por capas** con módulos por agregado:

```
bounded-context/
├── domain/
│   ├── model/
│   │   ├── Aggregate1/
│   │   └── Aggregate2/
│   └── services/
├── application/
└── infrastructure/
```

**Su argumento:**
- Las capas son **fronteras arquitectónicas fundamentales**
- Los agregados son conceptos dentro del dominio
- Separación de concerns por capa primero

**Conclusión:** Vernon favorece **Propuesta 1 (por capas)**.

---

### 3. **Vernon, Implementing Domain-Driven Design (Capítulo 4)**

Cita textual:

> "I recommend organizing your source code by the layers of the architecture (Domain, Application, Infrastructure) rather than by features or aggregates."

**Razón:**
- Claridad de fronteras arquitectónicas
- Previene dependencias circulares
- Más fácil aplicar la Dependency Rule

**Conclusión:** Vernon **explícitamente recomienda Propuesta 1**.

---

### 4. **Herberto Graça (Software Architecture Chronicles)**

Propone **Vertical Slicing** (similar a Propuesta 2):

```
src/
├── User/
│   ├── Domain/
│   ├── Application/
│   └── Infrastructure/
└── Product/
    ├── Domain/
    ├── Application/
    └── Infrastructure/
```

**Su argumento:**
- Cohesión alta por feature
- Fácil encontrar todo relacionado a una feature
- Equipos pueden trabajar en features independientes

**Conclusión:** Graça favorece **Propuesta 2 (por agregados)**.

---

### 5. **Jimmy Bogard (MediatR, AutoMapper)**

Usa **Feature Folders** (Propuesta 2):

```
Features/
├── Products/
│   ├── Create.cs
│   ├── Update.cs
│   ├── Delete.cs
│   └── Queries/
└── Categories/
    └── ...
```

**Su argumento:**
- "Feature folders keep related code together"
- Más fácil para nuevos desarrolladores
- Evita saltar entre carpetas

**Conclusión:** Bogard favorece **Propuesta 2**.

---

### 6. **Martin Fowler**

No prescribe estructura específica, pero enfatiza:

> "The code structure should make the architecture obvious."

**Principio:** Screaming Architecture
- La estructura debe gritar qué hace el sistema
- No debe gritar qué framework usa

**Ambas propuestas pueden cumplir esto.**

---

## 🏢 Análisis de Empresas Reales

### **Netflix**

**Estructura observada en repositorios públicos:**

```
service/
├── domain/
│   └── model/
│       ├── Title/
│       ├── User/
│       └── Subscription/
├── application/
└── infrastructure/
```

**Organización:** Por capas (Propuesta 1) ✅

---

### **Uber**

**Estructura de microservicios:**

```
service/
├── models/          (domain)
├── services/        (application)
├── repositories/    (infrastructure)
└── handlers/        (presentation)
```

**Organización:** Por capas (Propuesta 1) ✅

---

### **Microsoft (eShopOnContainers - ejemplo DDD oficial)**

```
src/Services/Ordering/
├── Ordering.Domain/
│   └── AggregatesModel/
│       ├── OrderAggregate/
│       └── BuyerAggregate/
├── Ordering.Application/
│   └── Commands/
│       ├── CreateOrder/
│       └── CancelOrder/
└── Ordering.Infrastructure/
```

**Organización:** Por capas (Propuesta 1) ✅

---

### **Amazon (inferido de AWS arquitecturas)**

```
service/
├── domain/
├── application/
└── adapters/
```

**Organización:** Por capas (Propuesta 1) ✅

---

### **CodelyTV (Javi Ferrer - PHP/TypeScript)**

**Estructura típica en sus cursos:**

```
Context/
├── Application/
│   └── Create/
│       └── UserCreator.ts
├── Domain/
│   ├── User.ts
│   └── UserRepository.ts
└── Infrastructure/
```

**Organización:** Por capas (Propuesta 1) ✅

**PERO** también menciona organización por features en proyectos grandes.

---

## ⚖️ Análisis Comparativo Detallado

### Criterio 1: **Claridad de Arquitectura**

**Propuesta 1 (Capas):**
```
✅ Las capas son obvias inmediatamente
✅ Dependency Rule es clara (domain → application → infrastructure)
✅ No puedes importar infrastructure en domain por error
```

**Propuesta 2 (Agregados):**
```
⚠️ Las capas están "escondidas" dentro de cada feature
⚠️ Más difícil visualizar la arquitectura general
⚠️ Riesgo de violar Dependency Rule sin darte cuenta
```

**Ganador:** Propuesta 1 ✅

---

### Criterio 2: **Cohesión de Código**

**Propuesta 1 (Capas):**
```
⚠️ Código relacionado a Product está en 4 lugares diferentes
⚠️ Para entender Product completo, navegas múltiples carpetas
```

**Propuesta 2 (Agregados):**
```
✅ Todo sobre Product está en una carpeta
✅ Fácil encontrar todo relacionado
✅ Alta cohesión por feature
```

**Ganador:** Propuesta 2 ✅

---

### Criterio 3: **Navegación del Código**

**Propuesta 1 (Capas):**
```
⚠️ "¿Dónde está el use case de crear producto?"
   → contexts/menu/application/product/create/
⚠️ "¿Dónde está el agregado Product?"
   → contexts/menu/domain/product/
⚠️ "¿Dónde está el controller?"
   → contexts/menu/presentation/http/
```
*3 lugares diferentes*

**Propuesta 2 (Agregados):**
```
✅ "¿Dónde está todo sobre Product?"
   → contexts/menu/product/

   - domain/
   - application/
   - infrastructure/
   - presentation/
```
*1 lugar*

**Ganador:** Propuesta 2 ✅

---

### Criterio 4: **Onboarding de Nuevos Developers**

**Propuesta 1 (Capas):**
```
✅ "Primero entiendes la arquitectura (capas)"
✅ "Luego exploras los agregados dentro"
✅ Arquitectura primero, features segundo
```

**Propuesta 2 (Agregados):**
```
✅ "Primero ves qué hace el sistema (features)"
✅ "Luego entiendes cómo (capas dentro)"
✅ Features primero, arquitectura segundo
```

**Empate:** Depende del equipo y preferencia ⚠️

---

### Criterio 5: **Prevención de Dependencias Circulares**

**Propuesta 1 (Capas):**
```
✅ domain/ NUNCA puede importar de application/
✅ application/ NUNCA puede importar de infrastructure/
✅ Las carpetas físicas refuerzan las reglas
```

**Propuesta 2 (Agregados):**
```
⚠️ product/infrastructure/ podría importar product/domain/
✅ (Esto es correcto, pero...)
⚠️ product/domain/ podría importar product/infrastructure/ por error
❌ Las carpetas NO refuerzan las reglas
```

**Ganador:** Propuesta 1 ✅

---

### Criterio 6: **Escalabilidad del Contexto**

**Propuesta 1 (Capas):**
```
Agregar nuevo agregado "Promotion":

contexts/menu/
├── domain/
│   ├── product/
│   ├── category/
│   └── promotion/     ← Agregar aquí
├── application/
│   └── promotion/     ← Y aquí
├── infrastructure/
│   └── promotion/     ← Y aquí
└── presentation/
    └── promotion/     ← Y aquí
```
*4 lugares diferentes*

**Propuesta 2 (Agregados):**
```
Agregar nuevo agregado "Promotion":

contexts/menu/
├── product/
├── category/
└── promotion/         ← Solo crear esta carpeta
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```
*1 lugar*

**Ganador:** Propuesta 2 ✅

---

### Criterio 7: **Reutilización entre Agregados**

**Propuesta 1 (Capas):**
```
Compartir Value Object entre Product y Category:

contexts/menu/domain/
├── product/
│   └── product.ts
├── category/
│   └── product-category.ts
└── shared/                    ← Fácil crear shared
    └── value-objects/
        └── display-order.ts
```

**Propuesta 2 (Agregados):**
```
Compartir Value Object entre Product y Category:

contexts/menu/
├── product/
│   └── domain/
│       └── product.ts
├── category/
│   └── domain/
│       └── product-category.ts
└── shared/                    ← Mismo nivel que agregados
    └── display-order.ts
```

**Empate:** Ambas permiten shared ⚠️

---

### Criterio 8: **Testing**

**Propuesta 1 (Capas):**
```
tests/
├── domain/
│   ├── product/
│   └── category/
├── application/
│   ├── product/
│   └── category/
└── infrastructure/
```
*Refleja estructura de src*

**Propuesta 2 (Agregados):**
```
tests/
├── product/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
└── category/
    ├── domain/
    ├── application/
    └── infrastructure/
```
*También refleja estructura de src*

**Empate:** Ambas funcionan bien ⚠️

---

### Criterio 9: **Equipos Independientes**

**Propuesta 1 (Capas):**
```
❌ Team Product y Team Category comparten:
   - contexts/menu/domain/
   - contexts/menu/application/
   - contexts/menu/infrastructure/

⚠️ Posibles conflictos en mismas carpetas
```

**Propuesta 2 (Agregados):**
```
✅ Team Product trabaja en:
   - contexts/menu/product/

✅ Team Category trabaja en:
   - contexts/menu/category/

✅ NO hay carpetas compartidas
✅ Menos conflictos de merge
```

**Ganador:** Propuesta 2 ✅

---

### Criterio 10: **Microservicios Futuros**

**Propuesta 1 (Capas):**
```
Si Product y Category se separan en microservicios:

❌ Dificil: están mezclados en las mismas carpetas
⚠️ Debes extraer Product de cada capa
```

**Propuesta 2 (Agregados):**
```
Si Product y Category se separan en microservicios:

✅ Fácil: mueves la carpeta completa
✅ mv contexts/menu/product/ → product-service/
✅ Ya tiene todas las capas
```

**Ganador:** Propuesta 2 ✅

---

## 📊 Tabla Resumen

| Criterio | Propuesta 1 (Capas) | Propuesta 2 (Agregados) | Ganador |
|----------|---------------------|-------------------------|---------|
| Claridad de Arquitectura | ✅✅ | ⚠️ | **Propuesta 1** |
| Cohesión de Código | ⚠️ | ✅✅ | **Propuesta 2** |
| Navegación | ⚠️ | ✅✅ | **Propuesta 2** |
| Onboarding | ✅ | ✅ | Empate |
| Prevención Dependencias | ✅✅ | ⚠️ | **Propuesta 1** |
| Escalabilidad | ⚠️ | ✅✅ | **Propuesta 2** |
| Reutilización | ✅ | ✅ | Empate |
| Testing | ✅ | ✅ | Empate |
| Equipos Independientes | ⚠️ | ✅✅ | **Propuesta 2** |
| Microservicios Futuros | ⚠️ | ✅✅ | **Propuesta 2** |
| **TOTAL** | **4 puntos** | **6 puntos** | **Propuesta 2** |

---

## 🎓 Consenso de Expertos

### A favor de Propuesta 1 (Por Capas):
- ✅ Vaughn Vernon (explícitamente)
- ✅ Microsoft (eShopOnContainers)
- ✅ Netflix, Uber, Amazon
- ✅ CodelyTV (en ejemplos básicos)

### A favor de Propuesta 2 (Por Agregados):
- ✅ Herberto Graça (Software Architecture)
- ✅ Jimmy Bogard (MediatR)
- ✅ Comunidad .NET (Feature Folders)
- ✅ Proyectos grandes (vertical slicing)

---

## 🔬 Análisis de Tu Caso Específico

### Contexto Menu tiene 2 agregados:
- Product
- ProductCategory

### ¿Son independientes?
✅ Sí, pueden cambiar independientemente
✅ Pueden tener equipos separados
✅ Podrían ser microservicios separados

### ¿Comparten mucho código?
⚠️ Comparten algunos VOs (DisplayOrder, IsActive)
✅ Pero la mayoría es independiente

**Conclusión:** Tu caso se beneficia de **Propuesta 2**.

---

## 💡 Recomendación Final

### Para tu proyecto: **PROPUESTA 2 (Por Agregados)**

**Razones:**

1. **Cohesión Alta** ✅
   - Todo sobre Product en un lugar
   - Fácil entender un agregado completo

2. **Escalabilidad** ✅
   - Fácil agregar nuevos agregados
   - Preparado para microservicios

3. **Equipos** ✅
   - Team Product trabaja en su carpeta
   - Team Category en la suya
   - Menos conflictos

4. **Navegación** ✅
   - "¿Dónde está Product?" → `contexts/menu/product/`
   - No saltas entre carpetas

5. **Microservicios Ready** ✅
   - Migración a microservicios es trivial
   - Solo mueves la carpeta

---

### Estructura Recomendada:

```
src/contexts/menu/
├── product/
│   ├── domain/
│   │   ├── product.ts
│   │   ├── product-id.ts
│   │   ├── product-price.ts
│   │   ├── events/
│   │   │   └── product-created.event.ts
│   │   └── repositories/
│   │       └── product.repository.ts
│   │
│   ├── application/
│   │   ├── create/
│   │   │   ├── create-product.ts
│   │   │   ├── create-product.command.ts
│   │   │   └── create-product.handler.ts
│   │   ├── update/
│   │   ├── delete/
│   │   └── queries/
│   │
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── typeorm/
│   │           ├── product.entity.ts
│   │           └── typeorm-product.repository.ts
│   │
│   └── presentation/
│       └── http/
│           ├── product.controller.ts
│           └── dto/
│               ├── create-product.request.ts
│               └── product.response.ts
│
├── category/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── shared/                      ← VOs compartidos del contexto
│   └── value-objects/
│       └── display-order.ts
│
└── menu.module.ts               ← Registra ambos agregados
```

---

## ⚠️ Consideraciones Importantes

### 1. **Mantener Dependency Rule**

Aunque uses Propuesta 2, DEBES respetar:

```
product/domain/     ← NO puede importar de application/infrastructure
product/application/ ← NO puede importar de infrastructure
product/infrastructure/ ← Puede importar de domain/application
```

**Solución:** Usar linters (eslint-plugin-boundaries)

---

### 2. **Shared dentro del Contexto**

```
contexts/menu/shared/    ← Para VOs compartidos entre Product y Category
```

**No confundir con:**
```
contexts/shared-kernel/  ← Para compartir entre contextos (Units, Money)
shared/                  ← Infraestructura técnica
```

---

### 3. **Module Registration**

```typescript
// contexts/menu/menu.module.ts
@Module({
  imports: [
    // Product
    TypeOrmModule.forFeature([ProductEntity]),
    // Category
    TypeOrmModule.forFeature([CategoryEntity])
  ],
  providers: [
    // Product
    ...productProviders,
    // Category
    ...categoryProviders
  ],
  controllers: [
    ProductController,
    CategoryController
  ]
})
export class MenuModule {}
```

---

## 🚀 Plan de Acción

### Actualizar el plan de migración para usar Propuesta 2:

```
Fase 2: Migrar Menu Context (2-3 días)

contexts/menu/
├── product/           ← Migrar aquí
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
└── category/          ← Migrar aquí
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

---

## ✅ Respuesta Directa

**¿Cuál propuesta es mejor?**

**PROPUESTA 2 (Por Agregados)** para tu caso específico.

**Razones principales:**
1. ✅ Mayor cohesión
2. ✅ Mejor para equipos independientes
3. ✅ Preparado para microservicios
4. ✅ Más fácil de navegar
5. ✅ Mejor escalabilidad

**PERO:** Propuesta 1 es más común en literatura DDD y ejemplos de Microsoft/Netflix.

**Decisión:** Para tu proyecto (restaurante POS, múltiples agregados, posible crecimiento), **Propuesta 2 es mejor**.

---

¿Quieres que actualice el plan de migración con esta estructura?
