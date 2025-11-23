import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn
} from 'typeorm'

@Entity('unit_conversions')
@Unique(['fromUnitId', 'toUnitId']) // Una conversión por par de unidades
@Index(['fromUnitId', 'toUnitId']) // Para búsquedas rápidas
export class UnitConversionEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'from_unit_id' })
  @Index()
  fromUnitId: string

  @Column({ type: 'uuid', name: 'to_unit_id' })
  @Index()
  toUnitId: string

  @Column({ type: 'decimal', precision: 15, scale: 6 })
  factor: number

  @Column({ type: 'text', nullable: true })
  description: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => UnitEntity, unit => unit.conversionsFrom)
  @JoinColumn({ name: 'from_unit_id' })
  fromUnit: UnitEntity

  @ManyToOne(() => UnitEntity, unit => unit.conversionsTo)
  @JoinColumn({ name: 'to_unit_id' })
  toUnit: UnitEntity
}
