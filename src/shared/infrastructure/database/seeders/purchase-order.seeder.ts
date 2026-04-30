import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Seeder } from './seeder.interface'
import { PurchaseOrderEntity } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order.entity'
import { PurchaseOrderItemEntity } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order-item.entity'
import { SupplierEntity } from '@contexts/procurement/supplier/infrastructure/persistence/typeorm/supplier.entity'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'

interface PurchaseOrderItemDef {
  ingredientName: string
  quantityRequested: number
  unitSymbol: string
  unitCost: number
}

interface PurchaseOrderDef {
  supplierName: string
  status: PurchaseOrderStatus
  items: PurchaseOrderItemDef[]
  notes?: string
  daysAgo: number
}

export class PurchaseOrderSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const purchaseOrderRepo = dataSource.getRepository(PurchaseOrderEntity)

    // Check if purchase orders already exist
    const count = await purchaseOrderRepo.count()
    if (count > 0) {
      console.log('⏭️  Purchase orders already seeded, skipping...')
      return
    }

    // Get required entities
    const supplierRepo = dataSource.getRepository(SupplierEntity)
    const ingredientRepo = dataSource.getRepository(IngredientEntity)
    const unitRepo = dataSource.getRepository(UnitEntity)

    const suppliers = await supplierRepo.find()
    const ingredients = await ingredientRepo.find()
    const units = await unitRepo.find()

    if (suppliers.length === 0 || ingredients.length === 0 || units.length === 0) {
      console.log(
        '⚠️  Missing required entities (suppliers, ingredients, or units). Skipping purchase orders...'
      )
      return
    }

    const supplierMap = new Map(suppliers.map(s => [s.name, s]))
    const ingredientMap = new Map(ingredients.map(i => [i.name, i]))
    const unitMap = new Map(units.map(u => [u.symbol, u]))

    // Mock user IDs (in a real scenario, these would be actual user IDs from authentication)
    const mockUserId = uuid()
    const mockApproverId = uuid()

    const purchaseOrderDefinitions: PurchaseOrderDef[] = [
      // Órdenes de 2024 (para demostrar formato con diferentes años)
      {
        supplierName: 'Distribuidora San Fernando',
        status: 'CLOSED',
        daysAgo: 365, // Hace 1 año
        items: [
          {
            ingredientName: 'Pechuga de Pollo',
            quantityRequested: 30,
            unitSymbol: 'kg',
            unitCost: 12.0
          },
          { ingredientName: 'Chorizo', quantityRequested: 12, unitSymbol: 'kg', unitCost: 13.5 }
        ],
        notes: 'Orden histórica 2024'
      },
      {
        supplierName: 'Lácteos Gloria',
        status: 'CLOSED',
        daysAgo: 180, // Hace 6 meses
        items: [
          { ingredientName: 'Queso Edam', quantityRequested: 15, unitSymbol: 'kg', unitCost: 27.0 },
          { ingredientName: 'Mantequilla', quantityRequested: 8, unitSymbol: 'kg', unitCost: 14.5 }
        ],
        notes: 'Orden histórica 2024'
      },
      // Órdenes recientes de 2025
      {
        supplierName: 'Distribuidora San Fernando',
        status: 'RECEIVED',
        daysAgo: 15,
        items: [
          {
            ingredientName: 'Pechuga de Pollo',
            quantityRequested: 25,
            unitSymbol: 'kg',
            unitCost: 12.5
          },
          { ingredientName: 'Tocino', quantityRequested: 10, unitSymbol: 'kg', unitCost: 18.0 },
          {
            ingredientName: 'Jamón de Pierna',
            quantityRequested: 8,
            unitSymbol: 'kg',
            unitCost: 22.0
          }
        ],
        notes: 'Orden de carnes para la semana'
      },
      {
        supplierName: 'Panadería Artesanal El Buen Pan',
        status: 'RECEIVED',
        daysAgo: 2,
        items: [
          {
            ingredientName: 'Pan Ciabatta',
            quantityRequested: 100,
            unitSymbol: 'un',
            unitCost: 0.8
          },
          { ingredientName: 'Pan Francés', quantityRequested: 80, unitSymbol: 'un', unitCost: 0.5 },
          {
            ingredientName: 'Pan de Hamburguesa',
            quantityRequested: 60,
            unitSymbol: 'un',
            unitCost: 1.0
          }
        ],
        notes: 'Entrega diaria - Pedido del día'
      },
      {
        supplierName: 'Mercado Mayorista La Victoria',
        status: 'SENT',
        daysAgo: 1,
        items: [
          {
            ingredientName: 'Lechuga Americana',
            quantityRequested: 30,
            unitSymbol: 'un',
            unitCost: 2.5
          },
          { ingredientName: 'Tomate', quantityRequested: 20, unitSymbol: 'kg', unitCost: 3.0 },
          {
            ingredientName: 'Cebolla Morada',
            quantityRequested: 15,
            unitSymbol: 'kg',
            unitCost: 2.8
          },
          { ingredientName: 'Palta Hass', quantityRequested: 50, unitSymbol: 'un', unitCost: 4.0 }
        ],
        notes: 'Pedido semanal de verduras'
      },
      {
        supplierName: 'Lácteos Gloria',
        status: 'APPROVED',
        daysAgo: 0,
        items: [
          { ingredientName: 'Queso Edam', quantityRequested: 10, unitSymbol: 'kg', unitCost: 28.0 },
          {
            ingredientName: 'Queso Mozzarella',
            quantityRequested: 8,
            unitSymbol: 'kg',
            unitCost: 25.0
          },
          { ingredientName: 'Mantequilla', quantityRequested: 5, unitSymbol: 'kg', unitCost: 15.0 },
          {
            ingredientName: 'Crema de Leche',
            quantityRequested: 10,
            unitSymbol: 'L',
            unitCost: 8.0
          }
        ],
        notes: 'Pedido quincenal de lácteos'
      },
      {
        supplierName: 'Distribuidora de Bebidas Corporación Lindley',
        status: 'CLOSED',
        daysAgo: 10,
        items: [
          { ingredientName: 'Coca Cola', quantityRequested: 50, unitSymbol: 'L', unitCost: 3.5 },
          { ingredientName: 'Inca Kola', quantityRequested: 50, unitSymbol: 'L', unitCost: 3.5 },
          { ingredientName: 'Sprite', quantityRequested: 30, unitSymbol: 'L', unitCost: 3.2 },
          { ingredientName: 'Agua Mineral', quantityRequested: 60, unitSymbol: 'L', unitCost: 1.5 }
        ],
        notes: 'Pedido mensual de bebidas'
      },
      {
        supplierName: 'Alicorp - Distribuidora de Condimentos',
        status: 'PENDING_APPROVAL',
        daysAgo: 0,
        items: [
          { ingredientName: 'Mayonesa', quantityRequested: 10, unitSymbol: 'kg', unitCost: 12.0 },
          { ingredientName: 'Ketchup', quantityRequested: 8, unitSymbol: 'kg', unitCost: 10.0 },
          { ingredientName: 'Mostaza', quantityRequested: 5, unitSymbol: 'kg', unitCost: 11.0 },
          {
            ingredientName: 'Aceite Vegetal',
            quantityRequested: 20,
            unitSymbol: 'L',
            unitCost: 6.5
          }
        ],
        notes: 'Reposición de condimentos'
      },
      {
        supplierName: 'Granos del Perú SAC',
        status: 'DRAFT',
        daysAgo: 0,
        items: [
          {
            ingredientName: 'Arroz Blanco',
            quantityRequested: 50,
            unitSymbol: 'kg',
            unitCost: 3.2
          },
          {
            ingredientName: 'Frijoles Canarios',
            quantityRequested: 20,
            unitSymbol: 'kg',
            unitCost: 5.5
          }
        ],
        notes: 'Borrador - revisar cantidades'
      },
      {
        supplierName: 'Frigorífico Santa Rosa',
        status: 'PARTIALLY_RECEIVED',
        daysAgo: 5,
        items: [
          {
            ingredientName: 'Carne Molida de Res',
            quantityRequested: 30,
            unitSymbol: 'kg',
            unitCost: 16.0
          },
          { ingredientName: 'Chorizo', quantityRequested: 15, unitSymbol: 'kg', unitCost: 14.0 },
          {
            ingredientName: 'Salchicha Huachana',
            quantityRequested: 20,
            unitSymbol: 'kg',
            unitCost: 12.0
          }
        ],
        notes: 'Entrega parcial recibida - pendiente completar'
      }
    ]

    // Track counters per year for order numbers
    const yearCounters = new Map<number, number>()

    for (const orderDef of purchaseOrderDefinitions) {
      const supplier = supplierMap.get(orderDef.supplierName)
      if (!supplier) {
        console.log(`⚠️  Supplier "${orderDef.supplierName}" not found, skipping order`)
        continue
      }

      // Calculate dates based on status and daysAgo
      const requestedDate = new Date()
      requestedDate.setDate(requestedDate.getDate() - orderDef.daysAgo)

      // Generate order number in format PO-YYYY-NNN (counter resets per year)
      const year = requestedDate.getFullYear()
      const currentCounter = yearCounters.get(year) || 0
      const nextCounter = currentCounter + 1
      yearCounters.set(year, nextCounter)
      const orderNumber = `PO-${year}-${String(nextCounter).padStart(3, '0')}`

      const expectedDeliveryDate = new Date(requestedDate)
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 3)

      let approvedDate: Date | null = null
      let sentDate: Date | null = null
      let receivedDate: Date | null = null
      let closedDate: Date | null = null
      let approvedBy: string | null = null
      let sentBy: string | null = null
      let closedBy: string | null = null

      if (
        ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'].includes(orderDef.status)
      ) {
        approvedDate = new Date(requestedDate)
        approvedDate.setDate(approvedDate.getDate() + 1)
        approvedBy = mockApproverId
      }

      if (['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'].includes(orderDef.status)) {
        sentDate = new Date(approvedDate!)
        sentDate.setDate(sentDate.getDate() + 1)
        sentBy = mockUserId
      }

      if (['PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'].includes(orderDef.status)) {
        receivedDate = new Date(sentDate!)
        receivedDate.setDate(receivedDate.getDate() + 2)
      }

      if (orderDef.status === 'CLOSED') {
        closedDate = new Date(receivedDate!)
        closedDate.setDate(closedDate.getDate() + 1)
        closedBy = mockUserId
      }

      // Create items
      const items: Partial<PurchaseOrderItemEntity>[] = []
      let totalAmount = 0

      for (const itemDef of orderDef.items) {
        const ingredient = ingredientMap.get(itemDef.ingredientName)
        const unit = unitMap.get(itemDef.unitSymbol)

        if (!ingredient || !unit) {
          console.log(
            `⚠️  Ingredient "${itemDef.ingredientName}" or unit "${itemDef.unitSymbol}" not found, skipping item`
          )
          continue
        }

        const itemTotalCost = itemDef.quantityRequested * itemDef.unitCost
        totalAmount += itemTotalCost

        const item: Partial<PurchaseOrderItemEntity> = {
          id: uuid(),
          ingredientId: ingredient.id,
          quantityRequested: itemDef.quantityRequested,
          quantityRequestedUnitId: unit.id,
          unitCost: itemDef.unitCost,
          currency: 'PEN',
          totalCost: itemTotalCost,
          notes: null
        }

        // Add received quantities for appropriate statuses
        if (['PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'].includes(orderDef.status)) {
          if (orderDef.status === 'PARTIALLY_RECEIVED') {
            item.quantityReceived = itemDef.quantityRequested * 0.7 // 70% received
          } else {
            item.quantityReceived = itemDef.quantityRequested // 100% received
          }
          item.quantityReceivedUnitId = unit.id
        }

        items.push(item)
      }

      if (items.length === 0) {
        console.log(`⚠️  No valid items for order from "${orderDef.supplierName}", skipping order`)
        continue
      }

      // Create purchase order
      const purchaseOrder: Partial<PurchaseOrderEntity> = {
        id: uuid(),
        orderNumber,
        supplierId: supplier.id,
        status: orderDef.status,
        requestedBy: mockUserId,
        approvedBy,
        rejectedBy: null,
        sentBy,
        closedBy,
        totalAmount,
        currency: 'PEN',
        requestedDate,
        expectedDeliveryDate,
        approvedDate,
        sentDate,
        receivedDate,
        closedDate,
        notes: orderDef.notes || null
      }

      // Save order (items will be saved due to cascade)
      const savedOrder = await purchaseOrderRepo.save(purchaseOrder)

      // Associate items with the saved order
      for (const item of items) {
        item.purchaseOrderId = savedOrder.id
      }

      // Save items separately (since we need the order ID)
      const itemRepo = dataSource.getRepository(PurchaseOrderItemEntity)
      await itemRepo.save(items)
    }

    const finalCount = await purchaseOrderRepo.count()
    console.log(`✅ Seeded ${finalCount} purchase orders with their items`)
  }
}
