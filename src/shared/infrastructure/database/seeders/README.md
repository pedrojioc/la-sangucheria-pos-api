# Database Seeders

Este directorio contiene los seeders para poblar la base de datos con datos de prueba.

## 🚀 Uso Rápido

Para ejecutar todos los seeders con un solo comando:

```bash
pnpm seed:run
```

## 📋 Orden de Ejecución

Los seeders se ejecutan en el siguiente orden para respetar las dependencias de las tablas:

1. **UnitSeeder** - Unidades de medida (kg, g, L, ml, unidades, etc.)
2. **UnitConversionSeeder** - Conversiones entre unidades
3. **IngredientCategorySeeder** - Categorías de ingredientes (Carnes, Verduras, Lácteos, etc.)
4. **IngredientSeeder** - Ingredientes con datos realistas
5. **ProductCategorySeeder** - Categorías de productos (Sanguches, Bowls, Alitas, Bebidas, etc.)
6. **RecipeSeeder** - Recetas de cocina con sus ingredientes
7. **ProductSeeder** - Productos del menú
8. **InventoryBatchSeeder** - Lotes de inventario con stock

## 📊 Datos Generados

### Unidades (16 unidades)
- **Peso**: kg, g, mg, lb, oz
- **Volumen**: L, ml, gal, taza, cucharada, cucharadita
- **Conteo**: unidad, docena, paquete, caja, bolsa

### Categorías de Ingredientes (10 categorías)
- Carnes
- Verduras
- Lácteos
- Panadería
- Condimentos
- Bebidas
- Aceites y Grasas
- Granos y Legumbres
- Frutas
- Otros

### Ingredientes (~40 ingredientes)
Ingredientes realistas para un restaurante de sanguches, incluyendo:
- Carnes: pollo, carne molida, tocino, jamón, etc.
- Verduras: lechuga, tomate, palta, cebolla, etc.
- Lácteos: quesos, mantequilla, crema
- Condimentos: mayonesa, ketchup, mostaza, etc.
- Bebidas: gaseosas, jugos, cervezas
- Y más...

### Categorías de Productos (9 categorías)
- Sanguches
- Bowls
- Alitas
- Hamburguesas
- Bebidas
- Cocteles
- Postres
- Ensaladas
- Acompañamientos

### Recetas (6 recetas)
- Sanguch Clásico de Pollo
- Sanguch de Carne Premium
- Sanguch Especial con Palta
- Hamburguesa Clásica
- Bowl de Pollo Saludable
- Alitas BBQ

### Productos (~14 productos)
Productos del menú con precios, tiempos de preparación y tags

### Lotes de Inventario
- 1-3 lotes por ingrediente
- Con stock realista y fechas de vencimiento (para perecederos)
- Referencias de lote generadas automáticamente

## 🔄 Re-ejecutar Seeders

Los seeders están diseñados para ser **idempotentes**. Si los ejecutas múltiples veces:
- **NO duplicarán** datos
- Verifican si ya existen registros antes de insertar
- Saltan la ejecución si la tabla ya tiene datos

Para limpiar la base de datos y volver a poblarla:

```bash
# Opción 1: Drop completo y re-seed
pnpm db:reset

# Opción 2: Manual
pnpm schema:drop
pnpm migration:run
pnpm seed:run
```

## 🛠️ Crear Nuevos Seeders

Para crear un nuevo seeder:

1. Crea un archivo `my-seeder.seeder.ts`
2. Implementa la interfaz `Seeder`
3. Agrega el seeder al array en `seed.ts` en el orden correcto

Ejemplo:

```typescript
import { DataSource } from 'typeorm'
import { Seeder } from './seeder.interface'
import { MyEntity } from './my.entity'

export class MySeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(MyEntity)

    // Check if data already exists
    const count = await repository.count()
    if (count > 0) {
      console.log('⏭️  MyEntity already seeded, skipping...')
      return
    }

    // Insert data
    await repository.save([
      { /* ... */ }
    ])

    console.log('✅ Seeded MyEntity')
  }
}
```

## 📝 Notas

- Usa `@faker-js/faker` para generar datos realistas
- Los seeders respetan las relaciones entre tablas
- Los IDs son UUIDs generados con `uuid`
- Los datos son en español (Perú)
- Los precios están en soles peruanos (PEN)
