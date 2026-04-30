import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string

  @Column({ name: 'full_name', type: 'varchar', length: 200, nullable: true })
  fullName: string | null

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null
}
