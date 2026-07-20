import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'

@Entity('kitchen_ticket_print_jobs')
@Index(['status'])
@Index(['stationId'])
export class KitchenTicketPrintJobEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'ticket_number', type: 'int' })
  ticketNumber: number

  @Column({ name: 'station_id', type: 'uuid' })
  stationId: string

  @Column({ name: 'station_name', type: 'varchar', length: 100 })
  stationName: string

  @Column({ type: 'jsonb' })
  payload: KitchenPrintTicket

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null

  @Column({ name: 'printed_at', type: 'timestamp', nullable: true })
  printedAt: Date | null

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
