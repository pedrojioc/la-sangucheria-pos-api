import { OptionGroup } from '../../domain/option-group'
import { OptionGroupRepository } from '../../domain/repositories/option-group.repository'
import { OptionGroupId } from '../../domain/option-group-id'
import { OptionGroupNotFound } from '../../domain/exceptions/option-group-not-found.exception'

export class FindOptionGroup {
  constructor(private readonly repository: OptionGroupRepository) {}

  async run(id: string): Promise<OptionGroup> {
    const group = await this.repository.search(new OptionGroupId(id))

    if (!group) {
      throw new OptionGroupNotFound(id)
    }

    return group
  }
}
