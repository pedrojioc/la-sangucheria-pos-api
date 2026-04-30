import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * RegisterTransformationRequest - Request DTO
 *
 * DTO para registrar una transformación de ingredientes.
 *
 * IMPORTANTE: Usuario ingresa cantidades REALES
 * - inputQuantity: Cantidad real usada del ingrediente base
 * - outputQuantity: Cantidad real obtenida del ingrediente preparado
 * - El sistema calcula la merma automáticamente: input - output
 *
 * Ejemplo:
 * {
 *   "id": "uuid-123",
 *   "recipeId": "uuid-recipe",
 *   "inputQuantity": 5.0,
 *   "inputUnitId": "uuid-kg",
 *   "outputQuantity": 2.3,   ← Usuario ingresa lo que REALMENTE obtuvo
 *   "outputUnitId": "uuid-kg",
 *   "performedBy": "chef-pedro",
 *   "notes": "Preparación turno mañana"
 * }
 */
export class RegisterTransformationRequest {
  @IsUUID()
  id: string

  @IsUUID()
  recipeId: string

  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  inputQuantity: number

  @IsUUID()
  inputUnitId: string

  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  outputQuantity: number

  @IsUUID()
  outputUnitId: string

  @IsOptional()
  @IsString()
  notes?: string
}
