import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('discovered_printer_devices')
@Index(['establishmentId', 'connectionType', 'address'], { unique: true })
@Index(['establishmentId', 'connectionType', 'usbIdentifier'], { unique: true })
export class DiscoveredPrinterDeviceEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'establishment_id', type: 'uuid' })
  establishmentId: string

  @Column({ name: 'connection_type', type: 'varchar', length: 10 })
  connectionType: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null

  @Column({ name: 'usb_identifier', type: 'varchar', length: 255, nullable: true })
  usbIdentifier: string | null

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
