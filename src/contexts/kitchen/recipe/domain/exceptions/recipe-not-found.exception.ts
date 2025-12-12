import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeNotFound extends NotFoundException {
  constructor(id: string) {
    super(`Recipe with id ${id} does not exist`)
  }
}
