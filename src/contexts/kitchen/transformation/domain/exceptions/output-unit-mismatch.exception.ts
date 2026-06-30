import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class OutputUnitMismatchException extends BusinessRuleViolationException {
  constructor(ingredientId: string, expectedUnitId: string, receivedUnitId: string) {
    super(
      `Output unit mismatch for ingredient ${ingredientId}: expected unit ${expectedUnitId}, received ${receivedUnitId}`
    )
  }
}
