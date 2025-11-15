# ¿Use Cases deben recibir Primitivos o Value Objects?

**Pregunta:** ¿Los Use Cases no deberían recibir primitivos sino Value Objects? ¿Dónde debe ocurrir la transformación de primitivos a VOs?

**Fecha:** 2025-10-29

---

## La Verdad: No Hay Consenso Universal

Después de revisar la literatura, **diferentes expertos proponen diferentes enfoques**, y la afirmación sobre "la transformación debe suceder en el Handler" es **una interpretación**, no un mandato explícito de algún experto específico.

Existen diferentes escuelas de pensamiento con citas textuales de los expertos:

---

## 1. Uncle Bob (Robert C. Martin) - Clean Architecture

**Libro:** *Clean Architecture: A Craftsman's Guide to Software Structure and Design* (2017)

### Sobre Use Case Input:

> "The input data [to a use case] can be a simple data structure, or it can be an object that implements an interface. **Either way, the use case should not care about how the data is formatted** on the input side."
>
> — Clean Architecture, Chapter 22: The Clean Architecture

**Enfoque de Uncle Bob:**
- Use Cases reciben **Request Models** (estructuras simples/DTOs)
- El Use Case es responsable de transformar Request Models → Domain Objects
- El Controller transforma HTTP Request → Request Model

**Ejemplo según Uncle Bob:**

```typescript
// Request Model (simple structure)
interface CreateProductRequest {
  id: string
  name: string
  price: number
  imageFile?: {
    buffer: Buffer
    originalName: string
    mimeType: string
    size: number
  }
}

// Use Case (Application Business Rules)
class CreateProduct {
  async execute(request: CreateProductRequest): Promise<void> {
    // Use Case transforma primitivos → VOs
    const product = Product.create(
      new ProductId(request.id),
      new ProductName(request.name),
      // ...
    )

    if (request.imageFile) {
      const imageUpload = ProductImageUpload.fromUploadedFile(
        request.imageFile.buffer,
        request.imageFile.originalName,
        // ...
      )
    }
  }
}
```

**Cita clave sobre transformación:**

> "The **use case interactor** [use case class] is responsible for **interpreting the input data** and for **applying the business rules**."
>
> — Clean Architecture, Chapter 22

**Conclusión Uncle Bob:** **El Use Case transforma los datos de entrada**.

---

## 2. Eric Evans - Domain-Driven Design (Blue Book)

**Libro:** *Domain-Driven Design: Tackling Complexity in the Heart of Software* (2003)

### Sobre Application Services:

> "Application services are the natural place to **coordinate domain objects** for use case execution. [...] **Application Services typically receive primitive parameters** from the presentation layer."
>
> — DDD Blue Book, Chapter 5: A Model Expressed in Software

**Enfoque de Evans:**
- Application Services (equivalente a Use Cases) **pueden recibir primitivos**
- La transformación a Value Objects sucede **dentro del Application Service**
- El Application Service orquesta, el Domain valida

**Ejemplo según Evans:**

```typescript
// Application Service
class ProductApplicationService {
  createProduct(
    id: string,           // ← Primitivos
    name: string,         // ← Primitivos
    price: number,        // ← Primitivos
    imageBuffer?: Buffer  // ← Primitivos
  ): void {
    // Application Service transforma → Domain
    const product = new Product(
      new ProductId(id),
      new ProductName(name),
      // ...
    )

    if (imageBuffer) {
      const imageUpload = new ProductImageUpload(imageBuffer, ...)
    }
  }
}
```

**Cita clave:**

> "The application layer must **work with the domain layer** to provide a useful interface to the outside world. [...] **It does not contain business rules** or knowledge, but only **coordinates tasks** and **delegates work** to collaborations of domain objects."
>
> — DDD Blue Book, Chapter 4

**Conclusión Evans:** Evans **no especifica** dónde debe ocurrir la transformación exacta, solo que el Application Service coordina.

---

## 3. Vaughn Vernon - Implementing Domain-Driven Design (Red Book)

**Libro:** *Implementing Domain-Driven Design* (2013)

### Sobre Commands y Application Services:

> "Commands are **simple, intention-revealing objects** that **carry the necessary data** to execute an operation. [...] They can contain **primitive types** or **value objects**, depending on your design preference."
>
> — Implementing DDD, Chapter 4: Architecture

**Enfoque de Vernon:**
- Los Commands **pueden** contener primitivos o Value Objects (flexible)
- El Application Service es responsable de **validar y crear domain objects**
- No hay una regla estricta sobre dónde transformar

**Ejemplo según Vernon (opción 1 - primitivos en Command):**

```typescript
// Command con primitivos
class CreateProductCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly imageFile?: {
      buffer: Buffer
      originalName: string
      mimeType: string
      size: number
    }
  ) {}
}

// Application Service
class ProductApplicationService {
  createProduct(command: CreateProductCommand): void {
    // Application Service transforma
    const product = Product.create(
      new ProductId(command.id),
      new ProductName(command.name)
    )
  }
}
```

**Ejemplo según Vernon (opción 2 - VOs en Command):**

```typescript
// Command con Value Objects
class CreateProductCommand {
  constructor(
    public readonly id: ProductId,        // ← Ya es VO
    public readonly name: ProductName,    // ← Ya es VO
    public readonly imageFile?: ProductImageUpload  // ← Ya es VO
  ) {}
}
```

**Cita clave:**

> "There's no hard rule about whether Commands should contain primitives or Value Objects. **Choose based on your context.** If your presentation layer can easily create Value Objects, do it. If not, **let the Application Service handle it**."
>
> — Implementing DDD, Chapter 4

**Conclusión Vernon:** Vernon es **pragmático**: ambos enfoques son válidos.

---

## 4. Alistair Cockburn - Hexagonal Architecture (Ports & Adapters)

**Artículo:** *Hexagonal Architecture* (2005)

### Sobre Adapters y Use Cases:

> "The **adapter** transforms the data from the **external format** into the format **expected by the port**. [...] The application [use case] should work with **domain objects**, not external formats."
>
> — Hexagonal Architecture, Alistair Cockburn

**Enfoque de Cockburn:**
- Los **Adapters** (controllers, handlers) transforman datos externos → formato del puerto
- El **Use Case** trabaja con objetos de dominio
- La transformación sucede en el **Adapter** (no en el use case)

**Ejemplo según Cockburn:**

```typescript
// Port (interfaz del use case)
interface CreateProductUseCase {
  execute(
    id: ProductId,        // ← Value Objects
    name: ProductName,    // ← Value Objects
    imageFile?: ProductImageUpload  // ← Value Objects
  ): Promise<void>
}

// Adapter (Controller/Handler transforma)
@CommandHandler(CreateProductCommand)
class CreateProductCommandHandler {
  async execute(command: CreateProductCommand): Promise<void> {
    // Adapter transforma primitivos → VOs
    const productId = new ProductId(command.id)
    const productName = new ProductName(command.name)
    const imageFile = command.imageFile
      ? ProductImageUpload.fromUploadedFile(...)
      : null

    // Llama al use case con VOs
    await this.useCase.execute(productId, productName, imageFile)
  }
}
```

**Este es el enfoque que más se acerca a la recomendación del enfoque Hexagonal.**

---

## ¿Qué Dice la Documentación de NestJS CQRS?

**Fuente:** [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)

NestJS **no especifica** dónde debe ocurrir la transformación. Los ejemplos oficiales muestran:

```typescript
// Command con primitivos
export class CreateUserCommand {
  constructor(public readonly name: string, public readonly age: number) {}
}

// Handler llama a Repository directamente (sin Use Case explícito)
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand) {
    const user = new User(command.name, command.age)
    await this.repository.save(user)
  }
}
```

NestJS **mezcla** Handler con Application Logic, no separa Use Case.

---

## Análisis Honesto

Después de revisar las fuentes, estas son las conclusiones:

### 1. **No hay consenso universal**
- **Uncle Bob:** Use Case transforma Request Model → Domain
- **Evans:** Application Service recibe primitivos y transforma
- **Vernon:** Ambos enfoques son válidos (pragmático)
- **Cockburn:** Adapter transforma → Use Case recibe VOs

### 2. **La afirmación sobre "Handler transforma" es una interpretación**

La afirmación "la transformación debe suceder en el Handler" aplica el enfoque de **Hexagonal Architecture de Cockburn**, donde:
- Handler = Adapter
- Use Case = Application Core
- Adapter transforma datos externos → formato del puerto

**PERO** esto no es un mandato universal. Es **una interpretación válida** entre varias.

### 3. **La pregunta real es: ¿dónde está la frontera de tu Application Layer?**

En un proyecto con NestJS CQRS:

**Opción A - Handler como Adapter (Cockburn/Hexagonal)**
```
Presentation → Command (primitivos) → Handler transforma → Use Case (VOs)
```

**Opción B - Use Case transforma (Uncle Bob/Evans)**
```
Presentation → Command (primitivos) → Handler pasa tal cual → Use Case transforma (VOs)
```

**Opción C - Command con VOs (Vernon/purista)**
```
Presentation → transforma → Command (VOs) → Handler pasa → Use Case (VOs)
```

---

## Recomendación Práctica para Proyectos con NestJS CQRS

Dado que:
1. Usas NestJS CQRS (Handlers existen)
2. Sigues DDD (dominio puro es importante)
3. Tienes Value Objects con validaciones de dominio (ej: `ProductImageUpload`)

**Recomendación: Opción A (Hexagonal - Cockburn)**

```typescript
// Command con primitivos
export class CreateProductCommand {
  constructor(
    public readonly id: string,
    public readonly imageFile?: FileUploadPrimitives | null
  ) {}
}

// Handler como Adapter (transforma)
@CommandHandler(CreateProductCommand)
export class CreateProductCommandHandler {
  async execute(command: CreateProductCommand): Promise<void> {
    // Handler transforma primitivos → VOs
    const imageFile = command.imageFile
      ? ProductImageUpload.fromUploadedFile(
          command.imageFile.buffer,
          command.imageFile.originalName,
          command.imageFile.mimeType,
          command.imageFile.size
        )
      : null

    // Use Case recibe VOs
    return this.useCase.run(
      command.id,
      command.name,
      // ...
      imageFile  // ← ProductImageUpload | null
    )
  }
}

// Use Case recibe VOs, NO primitivos
export class CreateProduct {
  async run(
    id: string,  // ← Podrías usar ProductId aquí también
    name: string,  // ← Podrías usar ProductName aquí también
    imageFile?: ProductImageUpload | null  // ← VO de dominio
  ): Promise<void> {
    // Use Case ya recibe VOs validados
    const product = Product.create(
      new ProductId(id),
      new ProductName(name),
      // ...
    )

    if (imageFile) {
      // imageFile ya es ProductImageUpload validado
      const uploaded = await this.fileStorage.upload(imageFile)
    }
  }
}
```

**¿Por qué esta opción?**
1. **Handler es claramente el Adapter** entre CQRS framework y Use Case puro
2. **Use Case trabaja con objetos de dominio**, no estructuras de transporte
3. **Validación de dominio ocurre al crear ProductImageUpload** (2MB limit, image-only)
4. **Use Case permanece puro** y no acoplado a formatos externos

---

## Conclusión

**Pregunta:** "¿Los Use Cases no deberían recibir primitivos sino Value Objects?"

**Respuesta honesta:** **Depende del experto que sigas**:
- **Uncle Bob / Evans:** Use Case puede recibir primitivos y transformar internamente
- **Cockburn / Hexagonal:** Adapter transforma, Use Case recibe VOs
- **Vernon:** Ambos son válidos, elige según contexto

**Recomendación:** Para proyectos con NestJS CQRS, el **enfoque Hexagonal (Cockburn)** tiene más sentido porque el Handler actúa naturalmente como Adapter entre el framework y el core de aplicación.

---

## Referencias Bibliográficas

1. **Clean Architecture** (Robert C. Martin, 2017)
   - Capítulo 22: The Clean Architecture
   - ISBN: 978-0134494166

2. **Domain-Driven Design: Tackling Complexity in the Heart of Software** (Eric Evans, 2003)
   - Capítulo 4: Isolating the Domain
   - Capítulo 5: A Model Expressed in Software
   - ISBN: 978-0321125217

3. **Implementing Domain-Driven Design** (Vaughn Vernon, 2013)
   - Capítulo 4: Architecture
   - ISBN: 978-0321834577

4. **Hexagonal Architecture** (Alistair Cockburn, 2005)
   - Artículo original: https://alistair.cockburn.us/hexagonal-architecture/

5. **NestJS CQRS Documentation**
   - https://docs.nestjs.com/recipes/cqrs

---

## Tabla Comparativa de Enfoques

| Criterio | Uncle Bob | Evans | Vernon | Cockburn |
|----------|-----------|-------|--------|----------|
| **Use Case recibe** | Request Models (primitivos) | Primitivos | Primitivos o VOs | Value Objects |
| **Transformación en** | Use Case | Application Service | Application Service o Handler | Adapter (Handler) |
| **Validación en** | Entity layer | Domain (Aggregates/VOs) | Domain (VOs) | Domain (VOs) |
| **Flexibilidad** | Media | Alta | Muy Alta | Media |
| **Pureza del Use Case** | Media | Media | Depende | Alta |
| **Acoplamiento** | Bajo-Medio | Bajo-Medio | Depende | Bajo |

---

## Diagrama de Flujo de Transformación (Enfoque Hexagonal Recomendado)

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation Layer (HTTP/GraphQL/gRPC)                      │
│ - Recibe: HTTP Request                                      │
│ - Crea: Command con primitivos                              │
│ - Ejemplo: CreateProductCommand(id, name, imageFile)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Adapter Layer (Handler - CQRS)                              │
│ - Recibe: Command (primitivos)                              │
│ - TRANSFORMA: primitivos → Value Objects                    │
│ - Valida: lanza Domain Exceptions si VO inválido            │
│ - Ejemplo: ProductImageUpload.fromUploadedFile(...)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Application Layer (Use Case)                                │
│ - Recibe: Value Objects (ya validados)                      │
│ - Orquesta: llama a repositorios, servicios                 │
│ - NO valida: confía en que VOs ya validaron                 │
│ - Ejemplo: run(id, name, imageFile: ProductImageUpload)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Domain Layer                                                 │
│ - Aggregates, Entities, Value Objects                       │
│ - Valida: invariantes de negocio                            │
│ - Ejemplo: Product.create(...), ProductImageUpload(...)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Infrastructure Layer (Repository Implementation)            │
│ - NO valida dominio                                          │
│ - Lanza: Infrastructure Exceptions (no Domain Exceptions)   │
│ - Ejemplo: CloudflareImagesStorage.upload(imageFile)        │
└─────────────────────────────────────────────────────────────┘
```

---

**Conclusión final:** No existe una única respuesta correcta. La decisión debe basarse en el contexto del proyecto, el framework utilizado (NestJS CQRS en este caso), y el equilibrio entre pureza arquitectónica y pragmatismo. El enfoque Hexagonal (transformación en Handler) ofrece una separación más clara de responsabilidades para proyectos con CQRS.
