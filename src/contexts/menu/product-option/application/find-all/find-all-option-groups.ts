import { OptionGroup } from '../../domain/option-group'
import { OptionGroupRepository } from '../../domain/repositories/option-group.repository'

export class FindAllOptionGroups {
  constructor(private readonly repository: OptionGroupRepository) {}

  async run(): Promise<OptionGroup[]> {
    return this.repository.searchAll()
  }
}
