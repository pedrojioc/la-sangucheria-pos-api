import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class InputUnitMismatchException extends BusinessRuleViolationException {
  constructor(ingredientId: string, expectedUnitId: string, receivedUnitId: string) {
    super(
      `Input unit mismatch for ingredient ${ingredientId}: expected unit ${expectedUnitId}, received ${receivedUnitId}`
    )
  }
}
