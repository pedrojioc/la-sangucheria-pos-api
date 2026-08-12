import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { DiscoveredPrinterDeviceEntity } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/discovered-printer-device.entity'

@Entity('stations')
@Index(['name'], { unique: true })
export class StationEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string

  @Column({ name: 'display_order', type: 'smallint', default: 0 })
  displayOrder: number

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null

  @Column({ name: 'output_device', type: 'varchar', length: 10, default: 'kds' })
  outputDevice: string

  @Column({ name: 'discovered_printer_device_id', type: 'uuid', nullable: true })
  discoveredPrinterDeviceId: string | null

  @ManyToOne(() => DiscoveredPrinterDeviceEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'discovered_printer_device_id' })
  discoveredPrinterDevice?: DiscoveredPrinterDeviceEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
