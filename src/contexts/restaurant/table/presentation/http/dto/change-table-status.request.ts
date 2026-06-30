import { IsEnum, IsNotEmpty } from 'class-validator'
import { TableStatus } from '../../../domain/table-status'

export class ChangeTableStatusRequest {
  @IsEnum(TableStatus, {
    message: 'Estado inválido. Valores permitidos: AVAILABLE, OCCUPIED, RESERVED, INACTIVE'
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  status: TableStatus
}
