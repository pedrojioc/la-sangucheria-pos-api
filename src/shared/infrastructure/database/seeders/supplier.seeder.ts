import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { faker } from '@faker-js/faker'
import { Seeder } from './seeder.interface'
import { SupplierEntity } from '@contexts/procurement/supplier/infrastructure/persistence/typeorm/supplier.entity'

interface SupplierDefinition {
  name: string
  contactName?: string
  email?: string
  phone?: string
  whatsappNumber?: string
  address?: string
  taxId?: string
  paymentTerms?: string
  notes?: string
  rating?: number
}

export class SupplierSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const supplierRepo = dataSource.getRepository(SupplierEntity)

    // Check if suppliers already exist
    const count = await supplierRepo.count()
    if (count > 0) {
      console.log('⏭️  Suppliers already seeded, skipping...')
      return
    }

    const supplierDefinitions: SupplierDefinition[] = [
      {
        name: 'Distribuidora San Fernando',
        contactName: 'Carlos Rodríguez',
        email: 'ventas@sanfernando.com.pe',
        phone: '01-317-5000',
        whatsappNumber: '+51-987-654-321',
        address: 'Av. Argentina 2315, Lima',
        taxId: '20100123456',
        paymentTerms: '30 días',
        notes: 'Proveedor principal de carnes y embutidos',
        rating: 5
      },
      {
        name: 'Panadería Artesanal El Buen Pan',
        contactName: 'María González',
        email: 'pedidos@elbuenpan.pe',
        phone: '01-234-5678',
        whatsappNumber: '+51-945-123-456',
        address: 'Jr. Cusco 456, Lima',
        taxId: '20456789012',
        paymentTerms: '15 días',
        notes: 'Entregas diarias de pan fresco. Horario: 5am - 7am',
        rating: 5
      },
      {
        name: 'Mercado Mayorista La Victoria',
        contactName: 'Juan Pérez',
        email: 'ventas@mercadolavictoria.com',
        phone: '01-456-7890',
        whatsappNumber: '+51-912-345-678',
        address: 'Av. Aviación 2890, La Victoria, Lima',
        taxId: '20234567890',
        paymentTerms: 'Contado',
        notes: 'Proveedor de frutas y verduras frescas',
        rating: 4
      },
      {
        name: 'Lácteos Gloria',
        contactName: 'Ana Torres',
        email: 'distribuidora@gloria.com.pe',
        phone: '01-315-0500',
        whatsappNumber: '+51-923-456-789',
        address: 'Av. República de Panamá 2461, Lima',
        taxId: '20131312955',
        paymentTerms: '45 días',
        notes: 'Proveedor de lácteos y derivados',
        rating: 5
      },
      {
        name: 'Distribuidora de Bebidas Corporación Lindley',
        contactName: 'Roberto Sánchez',
        email: 'pedidos@lindley.pe',
        phone: '01-311-7000',
        whatsappNumber: '+51-934-567-890',
        address: 'Av. J. Pardo 601, Miraflores, Lima',
        taxId: '20101024645',
        paymentTerms: '60 días',
        notes: 'Proveedor de bebidas Coca-Cola e Inca Kola',
        rating: 5
      },
      {
        name: 'Alicorp - Distribuidora de Condimentos',
        contactName: 'Patricia Vega',
        email: 'ventas@alicorp.com.pe',
        phone: '01-315-0800',
        whatsappNumber: '+51-956-789-012',
        address: 'Av. Argentina 4793, Callao',
        taxId: '20100055237',
        paymentTerms: '45 días',
        notes: 'Proveedor de aceites, condimentos y abarrotes',
        rating: 4
      },
      {
        name: 'Comercializadora Andina de Aceites',
        contactName: 'Miguel Fernández',
        email: 'contacto@aceites-andina.pe',
        phone: '01-567-8901',
        whatsappNumber: '+51-967-890-123',
        address: 'Av. Industrial 234, Lima',
        taxId: '20345678901',
        paymentTerms: '30 días',
        notes: 'Aceites vegetales y de oliva',
        rating: 4
      },
      {
        name: 'Granos del Perú SAC',
        contactName: 'Carmen López',
        email: 'ventas@granosdelperu.com',
        phone: '01-678-9012',
        whatsappNumber: '+51-978-901-234',
        address: 'Jr. Paruro 890, Lima',
        taxId: '20456789123',
        paymentTerms: 'Contado',
        notes: 'Arroz, frijoles y legumbres',
        rating: 3
      },
      {
        name: 'Distribuidora Universal',
        contactName: 'Luis Castillo',
        email: 'pedidos@universal.pe',
        phone: '01-789-0123',
        whatsappNumber: '+51-989-012-345',
        address: 'Av. Colonial 1234, Lima',
        taxId: '20567890234',
        paymentTerms: '15 días',
        notes: 'Proveedor diverso de abarrotes',
        rating: 4
      },
      {
        name: 'Frigorífico Santa Rosa',
        contactName: 'Rosa Mendoza',
        email: 'ventas@frigosantarosa.pe',
        phone: '01-890-1234',
        whatsappNumber: '+51-990-123-456',
        address: 'Av. Argentina 3456, Callao',
        taxId: '20678901345',
        paymentTerms: '30 días',
        notes: 'Carnes congeladas y embutidos',
        rating: 4
      }
    ]

    const suppliers: Partial<SupplierEntity>[] = supplierDefinitions.map(def => ({
      id: uuid(),
      name: def.name,
      contactName: def.contactName || null,
      email: def.email || null,
      phone: def.phone || null,
      whatsappNumber: def.whatsappNumber || null,
      address: def.address || null,
      taxId: def.taxId || null,
      paymentTerms: def.paymentTerms || null,
      notes: def.notes || null,
      rating: def.rating || null,
      isActive: true
    }))

    await supplierRepo.save(suppliers)

    console.log(`✅ Seeded ${suppliers.length} suppliers`)
  }
}
