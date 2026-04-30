import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('roles')
export class RoleEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null
}
