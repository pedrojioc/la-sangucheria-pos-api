import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('positions')
export class PositionEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null
}
