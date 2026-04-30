import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import { EmployeeStatusValue } from '../../../domain/employee-status'
import { SalaryBasisValue } from '../../../domain/employee-salary-basis'
import { PaymentFrequencyValue } from '../../../domain/employee-payment-frequency'
import { PositionEntity } from '@contexts/hr/position/infrastructure/persistence/typeorm/position.entity'

@Entity('employees')
@Index(['lastName'])
@Index(['status'])
export class EmployeeEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string

  @Column({ name: 'position_id', type: 'uuid', nullable: true })
  positionId: string | null

  @ManyToOne(() => PositionEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate: Date | null

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: EmployeeStatusValue

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId: string | null

  @Column({ name: 'salary_amount', type: 'bigint', nullable: true })
  salaryAmount: number | null

  @Column({ name: 'salary_basis', type: 'varchar', length: 20, nullable: true })
  salaryBasis: SalaryBasisValue | null

  @Column({ name: 'payment_frequency', type: 'varchar', length: 20, nullable: true })
  paymentFrequency: PaymentFrequencyValue | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
