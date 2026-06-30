import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class PreparationRecipeNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Preparation recipe with id ${id} not found`)
  }
}
