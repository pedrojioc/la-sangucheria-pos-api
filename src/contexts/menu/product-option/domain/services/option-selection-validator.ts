import { OptionGroup } from '../option-group'
import { MissingRequiredOptionGroup } from '../exceptions/missing-required-option-group.exception'
import { OptionGroupSelectionExceeded } from '../exceptions/option-group-selection-exceeded.exception'
import { OptionItemNotValidForProduct } from '../exceptions/option-item-not-valid-for-product.exception'

export interface OptionSelection {
  itemId: string
}

export interface ValidationError {
  code: string
  message: string
}

export class OptionSelectionValidator {
  validate(assignedGroups: OptionGroup[], selections: OptionSelection[]): ValidationError[] {
    const errors: ValidationError[] = []

    const allValidItemIds = new Set(
      assignedGroups.flatMap(group =>
        group
          .getItems()
          .filter(item => item.isActive)
          .map(item => item.id.value)
      )
    )

    for (const selection of selections) {
      if (!allValidItemIds.has(selection.itemId)) {
        throw new OptionItemNotValidForProduct(selection.itemId)
      }
    }

    for (const group of assignedGroups) {
      const groupItemIds = new Set(group.getItems().map(item => item.id.value))
      const selectedCount = selections.filter(s => groupItemIds.has(s.itemId)).length

      if (group.isRequired() && selectedCount < group.getMinSelections()) {
        throw new MissingRequiredOptionGroup(group.getName())
      }

      if (selectedCount > group.getMaxSelections()) {
        throw new OptionGroupSelectionExceeded(group.getName(), group.getMaxSelections())
      }
    }

    return errors
  }
}
